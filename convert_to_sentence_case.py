import re
import os

def to_sentence_case(text):
    if not text or len(text) < 1:
        return text
    
    # Check if it's already mostly lowercase
    # If it's something like "PDF", maybe we should keep it.
    # But user said "luego en minuscula".
    
    res = list(text.lower())
    for i, char in enumerate(res):
        if char.isalpha():
            res[i] = char.upper()
            break
    return "".join(res)

def process_content(content):
    # 1. Process JS-like key-value pairs (for translations)
    # Target: 'key': 'Value'
    kv_pattern = r"(['\"][\w\.]+['\"]\s*:\s*)(['\"])(.*?)(['\"])"
    def replace_kv(match):
        prefix = match.group(1)
        quote = match.group(2)
        value = match.group(3)
        suffix = match.group(4)
        if len(value) > 150 or '{' in value or '<' in value: # Skip long or complex strings
             return match.group(0)
        return f"{prefix}{quote}{to_sentence_case(value)}{suffix}"
    
    content = re.sub(kv_pattern, replace_kv, content)

    # 2. Process HTML tags text
    tags_pattern = r"(<(h1|h2|h3|h4|h5|h6|p|span|a|button|label|li|td|th|div)[^>]*>)([^<{}]+)(</\2>)"
    def replace_tags(match):
        start = match.group(1)
        text = match.group(3)
        end = match.group(4)
        # Skip if it looks like a template or is empty after stripping
        t_strip = text.strip()
        if not t_strip or '$' in text or '{{' in text or len(t_strip) < 2:
            return match.group(0)
        return f"{start}{to_sentence_case(text)}{end}"
    
    content = re.sub(tags_pattern, replace_tags, content, flags=re.IGNORECASE)

    # 3. Process HTML attributes
    attr_pattern = r"(\s(?:placeholder|title|alt)=)(['\"])(.*?)(['\"])"
    def replace_attrs(match):
        prefix = match.group(1)
        quote = match.group(2)
        value = match.group(3)
        suffix = match.group(4)
        return f"{prefix}{quote}{to_sentence_case(value)}{suffix}"
    
    content = re.sub(attr_pattern, replace_attrs, content, flags=re.IGNORECASE)

    return content

def run_global():
    frontend_dir = r'c:\Users\DELL\Desktop\I PAC 2026\PROGRAMACIÓN E IMPLEMENTACIÓN\Proyecto-Intercambio_Servicios_y_Habilidades\SemackroFrontend'
    
    for root, dirs, files in os.walk(frontend_dir):
        for file in files:
            if file.endswith(('.html', '.js')):
                file_path = os.path.join(root, file)
                print(f"Processing: {file_path}")
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    new_content = process_content(content)
                    
                    # Special manual additions for descubrir.js or others if needed
                    if file == 'descubrir.js':
                         new_content = new_content.replace('Máx. Postulantes:', 'Máx. postulantes:')
                         new_content = new_content.replace('Postulantes:', 'Postulantes:')
                         new_content = new_content.replace('Título:', 'Título:')
                         new_content = new_content.replace('Descripción:', 'Descripción:')
                         new_content = new_content.replace('Ubicación:', 'Ubicación:')
                         new_content = new_content.replace('Fecha Inicio:', 'Fecha inicio:')
                         new_content = new_content.replace('Fecha Fin:', 'Fecha fin:')
                         new_content = new_content.replace('Presupuesto:', 'Presupuesto:')
                         new_content = new_content.replace('Estado:', 'Estado:')
                         new_content = new_content.replace('Descargar PDF de la orden', 'Descargar pdf de la orden')

                    with open(file_path, 'w', encoding='utf-8') as f:
                        f.write(new_content)
                except Exception as e:
                    print(f"Error processing {file_path}: {e}")

if __name__ == "__main__":
    run_global()
