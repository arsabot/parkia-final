#!/usr/bin/env python3
import os
import subprocess
import sys
import pptx
from pptx.util import Inches

def main():
    base_dir = "/Users/Ariel/Desktop/Proyectos/parkia-final"
    slides_html = os.path.join(base_dir, "slides.html")
    export_dir = os.path.join(base_dir, "slides_export")
    output_pptx = os.path.join(base_dir, "PARKIA_Presentacion.pptx")
    chrome_path = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

    os.makedirs(export_dir, exist_ok=True)

    total_slides = 10
    slide_images = []

    print(f"🚀 Iniciando exportación de {total_slides} diapositivas desde {slides_html}...")

    for i in range(1, total_slides + 1):
        img_path = os.path.join(export_dir, f"slide_{i:02d}.png")
        url = f"file://{slides_html}?slide={i}&export=1"
        cmd = [
            chrome_path,
            "--headless=new",
            "--force-device-scale-factor=2",
            f"--screenshot={img_path}",
            "--window-size=1920,1080",
            url
        ]
        print(f"📸 Capturando Slide {i}/{total_slides}...")
        res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        if not os.path.exists(img_path) or os.path.getsize(img_path) == 0:
            print(f"❌ Error al capturar slide {i}: {res.stderr.decode('utf-8', errors='ignore')}")
            sys.exit(1)
        slide_images.append(img_path)
        print(f"  ✓ Slide {i:02d} guardada ({os.path.getsize(img_path) // 1024} KB)")

    print("\n📦 Creando presentación PowerPoint (.pptx) en formato 16:9 widescreen...")
    prs = pptx.Presentation()
    # 16:9 Widescreen dimensions (standard PowerPoint 13.333 x 7.5 inches)
    prs.slide_width = Inches(13.333333)
    prs.slide_height = Inches(7.5)
    blank_layout = prs.slide_layouts[6]

    for idx, img_path in enumerate(slide_images, start=1):
        slide = prs.slides.add_slide(blank_layout)
        slide.shapes.add_picture(img_path, Inches(0), Inches(0), prs.slide_width, prs.slide_height)
        print(f"  ✓ Diapositiva {idx:02d} agregada a la presentación.")

    prs.save(output_pptx)
    print(f"\n🎉 ¡Presentación PowerPoint generada con éxito!\n📁 Archivo: {output_pptx}")
    print(f"📊 Peso total del PPTX: {os.path.getsize(output_pptx) // 1024} KB")

if __name__ == "__main__":
    main()
