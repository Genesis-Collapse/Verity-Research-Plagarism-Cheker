import requests
files = {'file': ('dummy.pdf', b'%PDF-1.4', 'application/pdf')}
data = {'config': '{"sources": []}'}
try:
    res = requests.post('http://localhost:8000/api/scan', files=files, data=data)
    print(res.status_code)
    print(res.text)
except Exception as e:
    print(e)
