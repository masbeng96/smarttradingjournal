import os
from PIL import Image, ImageDraw

res_dir = r"android/app/src/main/res"

sizes = {
    "mipmap-mdpi": 48,
    "mipmap-hdpi": 72,
    "mipmap-xhdpi": 96,
    "mipmap-xxhdpi": 144,
    "mipmap-xxxhdpi": 192,
}

def draw_logo(size, is_round=False, is_foreground=False):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Scale factor
    s = size / 100.0
    
    if not is_foreground:
        # Dark Background
        bg_color = (11, 15, 25, 255) # #0b0f19
        if is_round:
            draw.ellipse([0, 0, size - 1, size - 1], fill=bg_color)
            # Border
            draw.ellipse([int(2*s), int(2*s), size - 1 - int(2*s), size - 1 - int(2*s)], outline=(16, 185, 129, 100), width=max(1, int(2*s)))
        else:
            radius = int(24 * s)
            draw.rounded_rectangle([0, 0, size - 1, size - 1], radius=radius, fill=bg_color)
            # Glow Border
            draw.rounded_rectangle([int(2*s), int(2*s), size - 1 - int(2*s), size - 1 - int(2*s)], radius=int(22*s), outline=(16, 185, 129, 100), width=max(1, int(2*s)))
    
    # Coordinates from logo.svg: M25 68 L42 50 L55 60 L75 32
    # In foreground mode, scale appropriately
    pts = [
        (int(25 * s), int(68 * s)),
        (int(42 * s), int(50 * s)),
        (int(55 * s), int(60 * s)),
        (int(75 * s), int(32 * s)),
    ]
    
    line_w = max(2, int(6 * s))
    # Draw shadow / glow
    draw.line(pts, fill=(6, 182, 212, 180), width=line_w + max(2, int(2*s)), joint="round")
    draw.line(pts, fill=(16, 185, 129, 255), width=line_w, joint="round")
    
    # Target Node Circle: cx 75, cy 32, r 5
    cx, cy = int(75 * s), int(32 * s)
    r = max(2, int(5 * s))
    draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(16, 185, 129, 255))
    
    # Arrow Head: M62 32 L75 32 L75 45
    arrow_pts = [
        (int(62 * s), int(32 * s)),
        (int(75 * s), int(32 * s)),
        (int(75 * s), int(45 * s)),
    ]
    draw.line(arrow_pts, fill=(16, 185, 129, 255), width=max(2, int(5 * s)), joint="round")
    
    return img

print("Generating Android Launcher Icons...")
for folder, size in sizes.items():
    folder_path = os.path.join(res_dir, folder)
    os.makedirs(folder_path, exist_ok=True)
    
    # 1. Standard square icon
    icon = draw_logo(size, is_round=False)
    icon.save(os.path.join(folder_path, "ic_launcher.png"), "PNG")
    
    # 2. Round icon
    icon_round = draw_logo(size, is_round=True)
    icon_round.save(os.path.join(folder_path, "ic_launcher_round.png"), "PNG")
    
    # 3. Foreground icon (for adaptive icon on legacy android)
    icon_fg = draw_logo(size, is_foreground=True)
    icon_fg.save(os.path.join(folder_path, "ic_launcher_foreground.png"), "PNG")

print("All Android launcher icons generated successfully!")
