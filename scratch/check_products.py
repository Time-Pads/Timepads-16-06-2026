import urllib.request
import json

def check_products():
    url = "https://timepads.in/products.json?limit=50"
    print(f"Fetching products from: {url}")
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode())
    except Exception as e:
        print(f"Error fetching products: {e}")
        return

    for p in data.get('products', []):
        print(f"\nProduct: {p.get('title')} ({p.get('handle')})")
        print("Variants:")
        for v in p.get('variants', []):
            print(f"  - {v.get('title')} | Price: {v.get('price')} | SKU: {v.get('sku')}")

if __name__ == "__main__":
    check_products()
