import os

# Directory containing images
image_directory = './images/'

# Get all files from the directory
all_files = os.listdir(image_directory)

# Filter out only the .jpg files
image_files = [f for f in all_files if f.endswith('.jpg')]
print('Read: ', len(image_files))
# Extract details from filenames
image_details = []
for image in image_files:
    print(image)
    parts = image.split('_')
    species = parts[0]
    source = parts[1]
    index = parts[2].split('.')[0]
    image_details.append({
        'name': image,
        'species': species,
        'source': source,
        'index': index
    })

# Save to a text file
with open('image_list.txt', 'w') as file:
    for detail in image_details:
        file.write(f'{{"name": "{detail["name"]}", "species": "{detail["species"]}", "source": "{detail["source"]}", "index": "{detail["index"]}" }},\n')

print("Image list saved to image_list.txt in the desired format.")
