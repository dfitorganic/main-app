import urllib.request
import json
import sys

url = "http://127.0.0.1:8000/api/order/create/"
data = {
    "name": "Test",
    "address": "123 Main St",
    "phone": "1234567890",
    "payment_method": "COD"
}

try:
    req = urllib.request.Request(
        url,
        data=json.dumps(data).encode('utf-8'),
        headers={'Content-Type': 'application/json'},
        method='POST'
    )
    with urllib.request.urlopen(req) as response:
        print(f"Response Code: {response.getcode()}")
        print(response.read().decode('utf-8'))
except urllib.error.HTTPError as e:
    print(f"HTTP Error Code: {e.code}")
    print(e.read().decode('utf-8'))
except Exception as e:
    print(f"Error: {e}")
