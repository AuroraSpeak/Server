#!/usr/bin/env python3
import os
import sys
import json
import subprocess
import shutil
import re

def run_command(cmd, cwd=os.getcwd()):
    """
    Run a command and return its stdout as a string.
    Prints debugging info (return code, stdout, and stderr).
    Even if the command exits with a nonzero return code,
    this function returns stdout.
    """
    print("\nRunning command:", " ".join(cmd))
    result = subprocess.run(cmd, capture_output=True, text=True, cwd=cwd)
    print("Return code:", result.returncode)
    if result.stdout:
        print("Stdout:", result.stdout)
    if result.stderr:
        print("Stderr:", result.stderr)
    return result.stdout.strip()

def ensure_tool_installed(tool_cmd, package_name):
    """
    Ensure that a tool is available via pnpm exec.
    If not, prompt to install package_name as a dev dependency.
    """
    try:
        output = run_command(['pnpm', 'exec'] + tool_cmd)
        print(f"{tool_cmd[0]} is installed. Version: {output}")
    except Exception as e:
        print(f"Error running {' '.join(tool_cmd)}: {e}")
        response = input(f"{tool_cmd[0]} is required but not installed. Install it with pnpm? (y/N): ").strip().lower()
        if response == 'y':
            subprocess.run(['pnpm', 'add', '-D', package_name], check=True)
        else:
            print(f"Cannot proceed without {tool_cmd[0]}. Exiting.")
            sys.exit(1)

def prompt_yes_no(message):
    response = input(message).strip().lower()
    return response == 'y'

def process_unused_packages(depcheck_data):
    """
    For each unused package, ask individually whether to uninstall it.
    """
    unused_packages = set(depcheck_data.get('dependencies', [])) | set(depcheck_data.get('devDependencies', []))
    if unused_packages:
        print("\nUnused packages detected:")
        for pkg in unused_packages:
            print(f" - {pkg}")
        for pkg in unused_packages:
            if prompt_yes_no(f"\nDo you want to uninstall '{pkg}'? (y/N): "):
                print(f"Uninstalling {pkg}...")
                try:
                    subprocess.run(['pnpm', 'remove', pkg], check=True)
                    print(f"{pkg} uninstalled successfully.")
                except subprocess.CalledProcessError as e:
                    print(f"Error uninstalling {pkg}: {e}")
            else:
                print(f"Skipping {pkg}.")
    else:
        print("No unused packages found.")

def scan_directory_for_orphans(directory):
    """
    Uses madge to scan the provided directory for orphan files.
    Returns a list of orphan file paths (relative to the scanned directory).
    """
    if not os.path.isdir(directory):
        print(f"Directory '{directory}' does not exist. Skipping.")
        return []
    madge_cmd = ['pnpm', 'exec', 'madge', directory, '--orphans', '--json', '--extensions', 'js,jsx,ts,tsx']
    output = run_command(madge_cmd)
    try:
        orphan_files = json.loads(output)
    except json.JSONDecodeError:
        print("Error parsing JSON from madge for directory:", directory)
        orphan_files = []
    return orphan_files

def search_file_usage(candidate_full_path, project_root):
    """
    Searches all project files (with extensions .js, .jsx, .ts, .tsx)
    for import/require statements that reference the candidate file.
    Uses a regex to match common import patterns.
    Returns a list of file paths where the candidate is imported.
    """
    candidate_basename = os.path.basename(candidate_full_path)
    candidate_name_without_ext = os.path.splitext(candidate_basename)[0]
    # This regex looks for patterns like:
    #   import ... from '...{candidate}...'
    #   require('...{candidate}...')
    #   import('...{candidate}...')
    pattern = re.compile(
        r'(?:import\s+.*?from\s+["\']|require\(\s*["\']|import\()\s*["\'][^"\']*' +
        re.escape(candidate_name_without_ext) +
        r'(?:\.js|\.jsx|\.ts|\.tsx)?["\']'
    )
    used_in = []
    for root, dirs, files in os.walk(project_root):
        # Skip common directories that we don't want to search.
        if 'node_modules' in dirs:
            dirs.remove('node_modules')
        if 'dist' in dirs:
            dirs.remove('dist')
        for file in files:
            if file.endswith(('.js', '.jsx', '.ts', '.tsx')):
                file_full_path = os.path.join(root, file)
                if os.path.abspath(file_full_path) == os.path.abspath(candidate_full_path):
                    continue
                try:
                    with open(file_full_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                    if pattern.search(content):
                        used_in.append(file_full_path)
                except Exception as e:
                    print(f"Could not read {file_full_path}: {e}")
    return used_in

def process_orphan_files(directory, relative_dir_name, project_root):
    """
    Processes orphan files in a given directory.
    For each file, it:
      - Searches the project for import/require statements referencing its basename.
      - If found, lists the files where it appears.
      - Prompts individually whether to delete the file.
    """
    orphan_files = scan_directory_for_orphans(directory)
    if orphan_files:
        print(f"\nOrphan files detected in '{relative_dir_name}':")
        for file in orphan_files:
            print(f" - {file}")
        for file in orphan_files:
            full_path = os.path.join(directory, file)
            if os.path.isfile(full_path):
                usage = search_file_usage(full_path, project_root)
                if usage:
                    print(f"\nThe file '{file}' appears to be imported in the following files:")
                    for ref in usage:
                        print("  -", ref)
                    if not prompt_yes_no(f"Delete '{file}' despite these import references? (y/N): "):
                        print(f"Skipping deletion of '{file}'.")
                        continue
                else:
                    print(f"\nNo import references found for '{file}'.")
                if prompt_yes_no(f"Delete '{file}' from '{relative_dir_name}'? (y/N): "):
                    try:
                        os.remove(full_path)
                        print(f"Deleted {full_path}")
                    except Exception as e:
                        print(f"Error deleting {full_path}: {e}")
                else:
                    print(f"Skipping file: {file}")
            else:
                print(f"{full_path} does not exist or is not a file.")
    else:
        print(f"No orphan files found in '{relative_dir_name}'.")

def main():
    project_root = os.getcwd()
    # Check if pnpm is available
    pnpm_path = shutil.which("pnpm")
    if not pnpm_path:
        print("pnpm not found in PATH. Please ensure pnpm is installed and in your PATH.")
        sys.exit(1)
    print("pnpm found at:", pnpm_path)
    print("Current PATH:", os.environ["PATH"])

    # Ensure that depcheck and madge are installed
    ensure_tool_installed(['depcheck', '--version'], 'depcheck')
    ensure_tool_installed(['madge', '--version'], 'madge')

    # --- Step 1: Run depcheck to find unused packages ---
    print("\nRunning depcheck to find unused packages...\n")
    depcheck_cmd = ['pnpm', 'exec', 'depcheck', '--json']
    depcheck_output = run_command(depcheck_cmd)
    try:
        depcheck_data = json.loads(depcheck_output)
    except json.JSONDecodeError:
        print("Error: Unable to parse JSON output from depcheck. Raw output:")
        print(depcheck_output)
        sys.exit(1)
    process_unused_packages(depcheck_data)

    # --- Step 2: Scan for orphan files in directories ---
    directories_to_scan = {
        "pages": os.path.join(project_root, "pages"),
        "components": os.path.join(project_root, "components"),
        "api": os.path.join(project_root, "api")
    }
    for label, path in directories_to_scan.items():
        print(f"\nScanning '{label}' directory for orphan files...")
        process_orphan_files(path, label, project_root)

if __name__ == "__main__":
    main()
