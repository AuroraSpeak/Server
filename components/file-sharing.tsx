"use client"

import { useState } from "react"
import { Upload, X, FileText, Image, Film, File } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const sharedFiles = [
  { id: 1, name: "Project Presentation.pdf", type: "pdf", size: "2.4 MB", uploader: "Alex", time: "10:30 AM" },
  { id: 2, name: "Meeting Notes.docx", type: "doc", size: "1.1 MB", uploader: "Taylor", time: "Yesterday" },
  { id: 3, name: "Team Photo.jpg", type: "image", size: "3.7 MB", uploader: "Jordan", time: "Yesterday" },
  { id: 4, name: "Product Demo.mp4", type: "video", size: "15.2 MB", uploader: "Casey", time: "Monday" },
]

export default function FileSharing() {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const handleUpload = () => {
    setIsUploading(true)
    setUploadProgress(0)

    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setTimeout(() => setIsUploading(false), 500)
          return 100
        }
        return prev + 10
      })
    }, 300)
  }

  const getFileIcon = (type: string) => {
    switch (type) {
      case "pdf":
      case "doc":
        return <FileText size={16} />
      case "image":
        return <Image size={16} />
      case "video":
        return <Film size={16} />
      default:
        return <File size={16} />
    }
  }

  return (
    <div className="border-t p-4">
      <Tabs defaultValue="files">
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="files">Files</TabsTrigger>
            <TabsTrigger value="shared">Shared</TabsTrigger>
          </TabsList>

          <Button size="sm" onClick={handleUpload} disabled={isUploading}>
            <Upload size={16} className="mr-2" />
            Upload
          </Button>
        </div>

        {isUploading && (
          <div className="mb-4 p-3 bg-muted rounded-md">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm">Uploading file...</span>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <X size={14} />
              </Button>
            </div>
            <Progress value={uploadProgress} className="h-2" />
          </div>
        )}

        <TabsContent value="files" className="m-0">
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {sharedFiles.map((file) => (
              <div key={file.id} className="flex items-center p-2 hover:bg-muted rounded-md text-sm">
                <div className="mr-3 text-muted-foreground">{getFileIcon(file.type)}</div>
                <div className="flex-1 min-w-0">
                  <p className="truncate font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {file.size} • {file.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="shared" className="m-0">
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {sharedFiles
              .filter((f) => f.uploader !== "You")
              .map((file) => (
                <div key={file.id} className="flex items-center p-2 hover:bg-muted rounded-md text-sm">
                  <div className="mr-3 text-muted-foreground">{getFileIcon(file.type)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {file.uploader} • {file.time}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

