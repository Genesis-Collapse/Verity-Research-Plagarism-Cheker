from fastapi import UploadFile, HTTPException
import magic

async def enforce_upload_guard(file: UploadFile):
    # Check file size (15MB max)
    if getattr(file, "size", None) is not None:
        if file.size > 15 * 1024 * 1024:
            raise HTTPException(status_code=413, detail="File too large. Max size is 15MB.")
    else:
        file.file.seek(0, 2)
        file_size = file.file.tell()
        file.file.seek(0)
        if file_size > 15 * 1024 * 1024:
            raise HTTPException(status_code=413, detail="File too large. Max size is 15MB.")
        
    # Check magic bytes for PDF signature
    header = await file.read(2048)
    await file.seek(0)
    
    mime_type = magic.from_buffer(header, mime=True)
    if mime_type != 'application/pdf':
        raise HTTPException(status_code=415, detail="Invalid file format. Only PDF files are supported.")
        
    return True
