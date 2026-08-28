import urllib.request
import xml.etree.ElementTree as ET
import re

def check_sitemap():
    main_url = "https://timepads.in/sitemap.xml"
    print(f"Fetching main sitemap: {main_url}")
    
    try:
        req = urllib.request.Request(main_url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as response:
            main_xml = response.read()
            status = response.status
    except Exception as e:
        print(f"Error fetching main sitemap: {e}")
        return

    print(f"HTTP Status: {status}")
    try:
        root = ET.fromstring(main_xml)
        print("XML Validity: Valid")
    except Exception as e:
        print(f"XML Validity: Invalid ({e})")
        return

    namespaces = {'ns': 'http://www.sitemaps.org/schemas/sitemap/0.9'}
    
    # Extract child sitemaps
    child_sitemaps = []
    for sitemap in root.findall('ns:sitemap', namespaces):
        loc = sitemap.find('ns:loc', namespaces)
        if loc is not None:
            child_sitemaps.append(loc.text)
            
    print(f"Number of sitemap files/index entries: {len(child_sitemaps)}")
    for i, cs in enumerate(child_sitemaps):
        print(f"  [{i+1}] {cs}")

    all_urls = []
    unwanted_patterns = [
        r'/cart',
        r'/search',
        r'/account',
        r'/tag/',
        r'/login',
        r'/register',
        r'/checkout',
        r'/challenge'
    ]
    
    unwanted_found = []
    
    for cs in child_sitemaps:
        print(f"\nFetching child sitemap: {cs}")
        try:
            req = urllib.request.Request(cs, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req) as response:
                cs_xml = response.read()
            cs_root = ET.fromstring(cs_xml)
            
            # Find all url locations
            urls = []
            for url in cs_root.findall('ns:url', namespaces):
                loc = url.find('ns:loc', namespaces)
                if loc is not None:
                    urls.append(loc.text)
            
            print(f"  Found {len(urls)} URLs in this sitemap.")
            all_urls.extend(urls)
            
            for url in urls:
                for pat in unwanted_patterns:
                    if re.search(pat, url, re.IGNORECASE):
                        unwanted_found.append((url, pat))
        except Exception as e:
            print(f"  Error processing child sitemap: {e}")

    print("\n--- Summary Report ---")
    print(f"Total URLs checked: {len(all_urls)}")
    print(f"Total Unwanted/Invalid URLs found: {len(unwanted_found)}")
    if unwanted_found:
        print("Unwanted URLs detailed:")
        for url, pat in unwanted_found:
            print(f"  - {url} (matched pattern: '{pat}')")
    else:
        print("No unwanted/invalid URLs found in the sitemap.")

if __name__ == "__main__":
    check_sitemap()
