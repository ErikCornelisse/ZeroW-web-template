import os
import requests
import json
from datetime import datetime
from urllib.parse import urlparse, urljoin
import re

# 1. Download JSON
data_url = "https://data.chorizoproject.eu/datastore/dump/2022b34f-8492-4e48-a8d8-dad29500f795?format=json"
response = requests.get(data_url)
data = response.json()

# 2. Parse JSON data
fields = data["fields"]
records = data["records"]

# Extract meta information from fields
# Merge fields with the first record to create a detailed description
# Extract the first record as descriptions
descriptions = records[0]

# Combine fields and descriptions into a detailed meta description
meta_description = []
for field, description in zip(fields, descriptions):
    meta_description.append({
        "name": field["id"].lower(), # Lowercase here
        "type": field["type"].lower(), # Lowercase here
        "description": str(description).strip() if description else ""
    })

# Add specific details for the seventh attribute
for attribute in meta_description:
    if attribute["name"] == "role of the action": # Adjusted to lowercase for comparison
        attribute["possible_values"] = [
            "RE-USE (HUMAN CONSUMPTION)",
            "RE-USE (ANIMAL FEED)",
            "RE-USE (BY-PRODUCTS) / RECYCLE (FOOD WASTE)",
            "RECYCLE (NUTRIENTS RECOVERY)",
            "RECOVERY (ENERGY)",
            "DISPOSAL"
        ]

# Update meta info
meta_info = {
    "source_url": data_url,
    "downloaded_at": datetime.utcnow().isoformat() + "Z",
    "description": meta_description # 'description' key itself will be lowercased later in the output dict
}

# Extract categories and their corresponding activities

def is_marker_record(item_record):
    # Helper function to check if a record is a marker record.
    # A marker record is a list of 8 elements, where the first is a number
    # and the rest are empty strings.
    if not (isinstance(item_record, list) and len(item_record) == 8):
        return False
    # Check if the first element is a number (JSON numbers are parsed to int/float by requests.json())
    if not isinstance(item_record[0], (int, float)):
        return False
    # Check if elements from index 1 to 7 are empty strings
    return all(elem == "" for elem in item_record[1:])

categories = {}
attribute_names = [attr["name"] for attr in meta_description] # Get attribute names from meta_description

# Ensure images/logos directory exists
logos_dir = os.path.join(os.path.dirname(__file__), "images", "logos")
os.makedirs(logos_dir, exist_ok=True)

i = 0
while i < len(records):
    # Check for category pattern: marker (records[i]), category_header (records[i+1]), marker (records[i+2])
    if i + 2 < len(records) and \
       is_marker_record(records[i]) and \
       is_marker_record(records[i+2]) and \
       isinstance(records[i+1], list) and len(records[i+1]) == 8 and \
       records[i+1][1] and isinstance(records[i+1][1], str) and records[i+1][1].strip():

        category_name = records[i+1][1].strip()
        # No lowercase for category_name itself as it's a value, not a key directly in the final JSON structure root.
        # It becomes a key in the "categories" object, which will be handled.
        categories[category_name] = []
        
        i += 3 # Move index past the category header and its trailing marker.
               # New 'i' points to the first potential activity record.
        
        # Collect activities for this category_name
        while i < len(records):
            # Check if the current record (records[i]) is the start of a NEW category pattern
            is_next_category_start = False
            if i + 2 < len(records) and \
               is_marker_record(records[i]) and \
               is_marker_record(records[i+2]) and \
               isinstance(records[i+1], list) and len(records[i+1]) == 8 and \
               records[i+1][1] and isinstance(records[i+1][1], str) and records[i+1][1].strip():
                is_next_category_start = True

            if is_next_category_start:
                break # Break from activity collection; outer loop will find and process this new category.

            # If current record is not a marker, it's a potential activity for the current category.
            if not is_marker_record(records[i]):
                activity_data = records[i]
                if isinstance(activity_data, list) and len(activity_data) == len(attribute_names):
                    activity_dict = {}
                    for idx, attr_name_key in enumerate(attribute_names):
                        activity_dict[attr_name_key.lower()] = activity_data[idx] # Lowercase attribute names (keys)

                    # --- START FAVICON LOGIC ---
                    source_url_val = activity_dict.get("source") # 'source' key is already lowercase
                    if source_url_val and isinstance(source_url_val, str) and (source_url_val.startswith("http://") or source_url_val.startswith("https://")):
                        favicon_found_path = None
                        try:
                            parsed_source_url = urlparse(source_url_val)
                            # Ensure netloc is present, otherwise skip
                            if not parsed_source_url.netloc:
                                raise ValueError("Invalid URL for favicon fetching (no netloc)")

                            base_url = f"{parsed_source_url.scheme}://{parsed_source_url.netloc}"
                            
                            favicon_attempt_urls = []
                            # 1. Standard favicon.ico at root
                            favicon_attempt_urls.append(urljoin(base_url, "/favicon.ico"))

                            # 2. Parse HTML for <link rel="icon/shortcut icon">
                            try:
                                # Use a common user-agent
                                headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'}
                                page_response = requests.get(source_url_val, timeout=10, headers=headers)
                                if page_response.status_code == 200:
                                    html_content = page_response.text
                                    # Regex to find <link ... href="..." ...> with rel="icon" or rel="shortcut icon"
                                    link_tags = re.findall(r'<link(?=[^>]*\\srel=(?:"(?:shortcut )?icon"|\'(?:shortcut )?icon\'))[^>]*\\shref=(?:"([^"]+)"|\'([^\']+)\')[^>]*>', html_content, re.IGNORECASE)
                                    for href_match in link_tags:
                                        href = href_match[0] if href_match[0] else href_match[1] # Handles "" or '' quotes
                                        if href:
                                            favicon_attempt_urls.append(urljoin(source_url_val, href.strip()))
                            except requests.exceptions.RequestException:
                                pass # Ignore errors fetching/parsing main page
                            
                            # Deduplicate URLs while trying to maintain order somewhat for preference
                            unique_favicon_urls = []
                            seen_urls = set()
                            for fav_url in favicon_attempt_urls:
                                if fav_url not in seen_urls:
                                    unique_favicon_urls.append(fav_url)
                                    seen_urls.add(fav_url)

                            for fav_url_attempt in unique_favicon_urls:
                                try:
                                    fav_response = requests.get(fav_url_attempt, timeout=10, stream=True, headers=headers)
                                    if fav_response.status_code == 200:
                                        content_type = fav_response.headers.get('Content-Type', '').lower()
                                        
                                        # Check if content type suggests an image or if URL extension is image-like for generic types
                                        is_image = 'image' in content_type or \
                                                   (fav_url_attempt.lower().endswith(('.ico', '.png', '.jpg', '.jpeg', '.gif', '.svg')) and \
                                                    ('application/octet-stream' in content_type or not content_type.strip()))


                                        if is_image:
                                            parsed_fav_url = urlparse(fav_url_attempt)
                                            fav_filename_base = re.sub(r'[^a-zA-Z0-9_.-]', '_', parsed_source_url.netloc)
                                            
                                            _, ext_from_url = os.path.splitext(parsed_fav_url.path)
                                            file_ext = ext_from_url.lower()

                                            if not file_ext or file_ext == ".": # If URL has no extension or just "."
                                                if 'image/png' in content_type: file_ext = ".png"
                                                elif 'image/jpeg' in content_type: file_ext = ".jpg" # Standardize to .jpg
                                                elif 'image/gif' in content_type: file_ext = ".gif"
                                                elif 'image/svg+xml' in content_type: file_ext = ".svg"
                                                elif 'image/x-icon' in content_type or 'image/vnd.microsoft.icon' in content_type: file_ext = ".ico"
                                                elif ('application/octet-stream' in content_type or not content_type.strip()) and fav_url_attempt.lower().endswith('.ico'): file_ext = ".ico"
                                                else: file_ext = ".ico" # Default if unsure but seems like an image
                                            
                                            if file_ext and not file_ext.startswith('.'): file_ext = '.' + file_ext
                                            
                                            favicon_filename = f"{fav_filename_base}_favicon{file_ext}"
                                            local_favicon_path = os.path.join(logos_dir, favicon_filename)
                                            
                                            with open(local_favicon_path, "wb") as f_icon:
                                                for chunk in fav_response.iter_content(8192): # Use a reasonable chunk size
                                                    f_icon.write(chunk)
                                            
                                            favicon_found_path = os.path.join("images", "logos", favicon_filename).replace(os.sep, '/')
                                            break # Found and saved one, no need to try others
                                except requests.exceptions.RequestException:
                                    continue # Try next URL
                        except Exception: 
                            # Broad exception catch for the entire favicon logic for this activity_dict
                            # This prevents a single URL's favicon error from stopping the script.
                            pass 

                        if favicon_found_path:
                            activity_dict["favicon"] = favicon_found_path
                    # --- END FAVICON LOGIC ---
                    categories[category_name].append(activity_dict)
                i += 1 # Move to next potential activity or non-activity record
            else:
                # Current record records[i] IS a marker, but not starting a new category.
                # Stop collecting activities for the current category.
                break 
    else:
        # Current record at 'i' is not the start of a category sequence, or not enough records left.
        i += 1

# 4. Build output dict
output = {
    "meta": meta_info, # Key "meta" will be lowercased when writing the final output if needed, but structure is fine
    "categories": categories # Key "categories" will be lowercased
}

# Before saving, ensure all top-level keys and nested keys in meta_info are lowercase
def lowercase_keys(obj):
    if isinstance(obj, dict):
        return {k.lower(): lowercase_keys(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [lowercase_keys(elem) for elem in obj]
    return obj

final_output = lowercase_keys(output)

# 5. Save as JSON
output_file_path = os.path.join(os.path.dirname(__file__), "chorizo_activities.json")
with open(output_file_path, "w", encoding="utf-8") as f:
    json.dump(final_output, f, indent=2, ensure_ascii=False)

print(f"Export complete! JSON file created at: {output_file_path}")

