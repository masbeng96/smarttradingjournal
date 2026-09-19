import os
from PIL import Image, ImageDraw

source_path = "public/logo-trading.jpg"
res_dir = r"android/app/src/main/res"

if not os.path.exists(source_path):
    raise FileNotFoundError(f"Source file {source_path} does not exist!")

src_img = Image.open(source_path).convert("RGBA")

sizes = {
    "mipmap-mdpi": 48,
    "mipmap-hdpi": 72,
    "mipmap-xhdpi": 96,
    "mipmap-xxhdpi": 144,
    "mipmap-xxxhdpi": 192,
}

def make_round(img):
    size = img.size
    mask = Image.new("L", size, 0)
    draw = ImageDraw.Draw(mask)
    draw.ellipse((0, 0, size[0], size[1]), fill=255)
    result = Image.new("RGBA", size, (0, 0, 0, 0))
    result.paste(img, (0, 0), mask)
    return result

def make_rounded_rect(img, radius_ratio=0.22):
    size = img.size
    radius = int(size[0] * radius_ratio)
    mask = Image.new("L", size, 0)
    draw = ImageDraw.Draw(mask)
    draw.rounded_rectangle((0, 0, size[0], size[1]), radius=radius, fill=255)
    result = Image.new("RGBA", size, (0, 0, 0, 0))
    result.paste(img, (0, 0), mask)
    return result

def make_foreground(src, canvas_size):
    canvas = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
    # Android adaptive icon safe zone is ~70%
    target_size = int(canvas_size * 0.72)
    resized_logo = src.resize((target_size, target_size), Image.Resampling.LANCZOS)
    rounded_logo = make_rounded_rect(resized_logo, radius_ratio=0.2)
    
    offset = (canvas_size - target_size) // 2
    canvas.paste(rounded_logo, (offset, offset), rounded_logo)
    return canvas

print("Generating Android Launcher Icons from logo-trading.jpg...")
for folder, size in sizes.items():
    folder_path = os.path.join(res_dir, folder)
    os.makedirs(folder_path, exist_ok=True)
    
    # 1. Standard square/rounded icon
    resized = src_img.resize((size, size), Image.Resampling.LANCZOS)
    icon_square = make_rounded_rect(resized, radius_ratio=0.18)
    icon_square.save(os.path.join(folder_path, "ic_launcher.png"), "PNG")
    
    # 2. Round icon
    icon_round = make_round(resized)
    icon_round.save(os.path.join(folder_path, "ic_launcher_round.png"), "PNG")
    
    # 3. Foreground icon for Adaptive Icons
    icon_fg = make_foreground(src_img, size)
    icon_fg.save(os.path.join(folder_path, "ic_launcher_foreground.png"), "PNG")

# Splash screens
splash_targets = {
    "drawable": (480, 320),
    "drawable-land-mdpi": (480, 320),
    "drawable-land-hdpi": (800, 480),
    "drawable-land-xhdpi": (1280, 720),
    "drawable-land-xxhdpi": (1600, 960),
    "drawable-land-xxxhdpi": (1920, 1280),
    "drawable-port-mdpi": (320, 480),
    "drawable-port-hdpi": (480, 800),
    "drawable-port-xhdpi": (720, 1280),
    "drawable-port-xxhdpi": (960, 1600),
    "drawable-port-xxxhdpi": (1280, 1920),
}

bg_color = (11, 15, 25, 255) # #0b0f19

print("Generating Android Splash Screens...")
for folder, (w, h) in splash_targets.items():
    folder_path = os.path.join(res_dir, folder)
    os.makedirs(folder_path, exist_ok=True)
    
    splash = Image.new("RGBA", (w, h), bg_color)
    min_dim = min(w, h)
    logo_size = int(min_dim * 0.35)
    if logo_size < 96:
        logo_size = min(96, min_dim - 20)
        
    scaled_logo = src_img.resize((logo_size, logo_size), Image.Resampling.LANCZOS)
    rounded_logo = make_rounded_rect(scaled_logo, radius_ratio=0.2)
    
    x = (w - logo_size) // 2
    y = (h - logo_size) // 2
    splash.paste(rounded_logo, (x, y), rounded_logo)
    
    splash.convert("RGB").save(os.path.join(folder_path, "splash.png"), "PNG")

print("All Android launcher icons and splash screens generated successfully!")
