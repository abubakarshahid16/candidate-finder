import base64
import io
import json
import sys

filename = sys.argv[1].lower()
data = base64.b64decode(sys.stdin.read())

if filename.endswith('.pdf'):
    from pypdf import PdfReader
    text = '\n'.join(page.extract_text() or '' for page in PdfReader(io.BytesIO(data)).pages)
elif filename.endswith('.docx'):
    from docx import Document
    document = Document(io.BytesIO(data))
    text = '\n'.join(paragraph.text for paragraph in document.paragraphs)
else:
    text = data.decode('utf-8')

print(json.dumps({'text': text}))
