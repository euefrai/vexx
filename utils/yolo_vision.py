"""
yolo_vision.py — Módulo de Integração com YOLOv8 no Hugging Face Spaces
API: https://euefrai-api-visao-yolo.hf.space
Permite que bots de jogos, automações e scanners analisem telas e detectem objetos,
coordenadas de clique e tags contextuais em tempo real.
"""

import os
from typing import Any, Dict, Optional, Tuple

SPACE_URL = os.environ.get("VEXX_VISION_API_URL", "https://euefrai-api-visao-yolo.hf.space")


def analisar_imagem_yolo(caminho_ou_url_imagem: str) -> dict:
    """
    Envia uma imagem (URL pública ou caminho local) para a API YOLOv8 no Hugging Face
    e retorna {'status', 'total_objetos', 'tags_busca', 'deteccoes'}.
    """
    from gradio_client import Client, handle_file

    client = Client(SPACE_URL)
    try:
        resultado = client.predict(
            imagem=handle_file(caminho_ou_url_imagem),
            api_name="/predict"
        )
    except Exception:
        resultado = client.predict(
            imagem=handle_file(caminho_ou_url_imagem),
            api_name="/detectar_objetos"
        )
    return resultado


def capturar_tela_e_analisar(
    regiao: Optional[Tuple[int, int, int, int]] = None,
    arquivo_temp: str = "temp_frame_yolo.png"
) -> dict:
    """
    Captura a tela (ou região específica) usando PIL.ImageGrab ou mss e analisa via YOLOv8.
    Retorna o dicionário com as detecções e coordenadas.
    """
    try:
        from PIL import ImageGrab
        bbox = regiao if regiao else None
        screenshot = ImageGrab.grab(bbox=bbox)
        screenshot.save(arquivo_temp)
    except Exception:
        import mss
        with mss.mss() as sct:
            monitor = (
                {"top": regiao[1], "left": regiao[0], "width": regiao[2] - regiao[0], "height": regiao[3] - regiao[1]}
                if regiao else sct.monitors[1]
            )
            sct_img = sct.grab(monitor)
            mss.tools.to_png(sct_img.rgb, sct_img.size, output=arquivo_temp)

    return analisar_imagem_yolo(arquivo_temp)


def encontrar_alvo(
    resposta_yolo: dict,
    rotulo_desejado: str,
    confianca_minima: float = 0.35
) -> Optional[Dict[str, Any]]:
    """
    Varre as detecções do YOLO procurando o melhor alvo pelo rótulo (ex: 'person', 'car', etc.).
    Retorna o objeto com centro_x e centro_y calculados para clique com pyautogui.
    """
    deteccoes = resposta_yolo.get("deteccoes", [])
    melhor_alvo = None
    maior_conf = 0.0

    termo = rotulo_desejado.strip().lower()
    for det in deteccoes:
        nome = str(det.get("classe") or det.get("rotulo") or det.get("name") or "").lower()
        conf = float(det.get("confianca") or det.get("confidence") or 0.0)

        if (termo in nome or nome in termo) and conf >= confianca_minima:
            if conf > maior_conf:
                maior_conf = conf
                melhor_alvo = det

    if melhor_alvo:
        box = melhor_alvo.get("box") or melhor_alvo.get("coordenadas") or []
        if len(box) >= 4:
            x1, y1, x2, y2 = box[0], box[1], box[2], box[3]
            cx = int((x1 + x2) / 2)
            cy = int((y1 + y2) / 2)
        else:
            pc = melhor_alvo.get("ponto_clique", {})
            cx = int(pc.get("x", 0))
            cy = int(pc.get("y", 0))

        melhor_alvo["centro_x"] = cx
        melhor_alvo["centro_y"] = cy

    return melhor_alvo


if __name__ == "__main__":
    print(f"[*] Conectando ao YOLO Space: {SPACE_URL}")
    try:
        resposta = analisar_imagem_yolo("https://ultralytics.com/images/bus.jpg")
        print("[+] Tags para busca:", resposta.get("tags_busca"))
        print("[+] Total de objetos:", resposta.get("total_objetos"))
        print("[+] Detecções completas:", resposta.get("deteccoes"))
    except Exception as e:
        print("[-] Erro ao testar:", e)
