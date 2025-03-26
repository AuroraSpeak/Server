#!/usr/bin/env python3
import os
import sys
import json
import subprocess
import shutil

def run_command(cmd):
    """
    Run a command and return its stdout as a string.
    Prints debugging info (return code, stdout, and stderr).
    Even if the command exits with a nonzero return code,
    this function returns stdout (useful when depcheck exits with 255).
    """
    print("Running command:", " ".join(cmd))
    result = subprocess.run(cmd, capture_output=True, text=True, cwd=os.getcwd())
    print("Return code:", result.returncode)
    if result.stdout:
        print("Stdout:", result.stdout)
    if result.stderr:
        print("Stderr:", result.stderr)
    return result.stdout.strip()

def main():
    # Check if pnpm is available
    pnpm_path = shutil.which("pnpm")
    if not pnpm_path:
        print("pnpm not found in PATH. Please ensure pnpm is installed and in your PATH.")
        sys.exit(1)
    print("pnpm found at:", pnpm_path)
    print("Current PATH:", os.environ["PATH"])

    # --- Step 1: Run depcheck to find unused packages ---
    print("\nRunning depcheck to find unused packages...\n")
    # Use pnpm exec to run depcheck in JSON mode
    depcheck_cmd = ['pnpm', 'exec', 'depcheck', '--json']
    depcheck_output = run_command(depcheck_cmd)
    
    try:
        depcheck_data = json.loads(depcheck_output)
    except json.JSONDecodeError:
        print("Error: Unable to parse JSON output from depcheck. Raw output:")
        print(depcheck_output)
        sys.exit(1)

    # Merge unused dependencies and devDependencies into a set.
    unused_packages = set(depcheck_data.get('dependencies', [])) | set(depcheck_data.get('devDependencies', []))
    
    if unused_packages:
        print("Unused packages detected:")
        for pkg in unused_packages:
            print(f" - {pkg}")
        confirm = input("\nDo you want to uninstall these packages? (y/N): ").strip().lower()
        if confirm == 'y':
            for pkg in unused_packages:
                print(f"\nUninstalling {pkg}...")
                try:
                    # For pnpm, use 'pnpm remove'
                    subprocess.run(['pnpm', 'remove', pkg], check=True)
                    print(f"{pkg} uninstalled successfully.")
                except subprocess.CalledProcessError as e:
                    print(f"Error uninstalling {pkg}: {e}")
        else:
            print("Skipping package removal.")
    else:
        print("No unused packages found.")

    # --- Step 2: Run madge to find orphan files in the pages directory ---
    pages_dir = os.path.join(os.getcwd(), "pages")
    print(f"\nRunning madge to find orphan files in '{pages_dir}'...\n")
    
    if not os.path.isdir(pages_dir):
        print("The 'pages' directory does not exist in this project. Skipping orphan file check.")
        return

    madge_cmd = ['pnpm', 'exec', 'madge', 'pages', '--orphans', '--json', '--extensions', 'js,jsx,ts,tsx']
    madge_output = run_command(madge_cmd)
    
    try:
        orphan_files = json.loads(madge_output)
    except json.JSONDecodeError:
        print("Error: Unable to parse JSON output from madge. Raw output:")
        print(madge_output)
        orphan_files = []

    if orphan_files:
        print("Orphan files detected in 'pages':")
        for file in orphan_files:
            print(f" - {file}")
        confirm = input("\nDo you want to delete these orphan files? (y/N): ").strip().lower()
        if confirm == 'y':
            for file in orphan_files:
                file_path = os.path.join(pages_dir, file)
                if os.path.isfile(file_path):
                    try:
                        os.remove(file_path)
                        print(f"Deleted {file_path}")
                    except Exception as e:
                        print(f"Error deleting {file_path}: {e}")
                else:
                    print(f"{file_path} does not exist or is not a file.")
        else:
            print("Skipping file deletion.")
    else:
        print("No orphan files found in 'pages' directory.")

if __name__ == "__main__":
    main()
