import pymupdf as fitz  # This is the module name for PyMuPDF

def extract_text_from_pdf(pdf_path):
    print(f"Loading document from: {pdf_path}")
    
    # 1. Open the PDF document
    doc = fitz.open(pdf_path)
    full_text = ""

    # 2. Iterate through every page in the document
    for page_num in range(len(doc)):
        # Load the specific page
        page = doc.load_page(page_num)
        
        # 3. Extract the text and append it to our full_text string
        # The get_text() method grabs the text as it appears visually
        full_text += page.get_text()

    return full_text

# --- Test the Pipeline ---
if __name__ == "__main__":
    # Define the path to your sample resume
    file_path = "resumes/sample.pdf"
    
    # Call the function and store the result
    raw_resume_text = extract_text_from_pdf(file_path)
    
    # Print the raw extracted text to the terminal
    print("\n--- Extracted Text ---\n")
    print(raw_resume_text)