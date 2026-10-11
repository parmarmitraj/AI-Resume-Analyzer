import pymupdf as fitz  # This is the module name for PyMuPDF

def extract_text_from_pdf(pdf_source):
    """
    Extracts text from a PDF given either a file path (str) or raw PDF bytes (bytes/bytearray).
    """
    if isinstance(pdf_source, (bytes, bytearray)):
        doc = fitz.open(stream=pdf_source, filetype="pdf")
    else:
        doc = fitz.open(pdf_source)
    
    full_text = ""
    for page_num in range(len(doc)):
        page = doc.load_page(page_num)
        full_text += page.get_text()

    doc.close()
    return full_text