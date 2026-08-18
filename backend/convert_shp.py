import shapefile
import json
import os

shp_path = os.path.join("..", "asset", "shapefile", "ADMINISTRASIKECAMATAN_AR_50K.shp")
sf = shapefile.Reader(shp_path)

features = []
for sr in sf.shapeRecords():
    feat = sr.__geo_interface__
    # Clean up properties to keep it small if we want, but let's keep all or at least NAMOBJ
    features.append(feat)

geojson = {
    "type": "FeatureCollection",
    "features": features
}

output_dir = os.path.join("..", "frontend", "src", "components")
os.makedirs(output_dir, exist_ok=True)
output_path = os.path.join(output_dir, "sijunjung_kecamatan.json")

with open(output_path, "w", encoding="utf-8") as f:
    json.dump(geojson, f)

print(f"GeoJSON written successfully to {output_path}")
print(f"Total features written: {len(features)}")
