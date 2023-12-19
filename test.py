# save_script.py
import json
import sys
from htmldocx import HtmlToDocx
from docx import Document

def save_to_docx(content):
    # Convert HTML to DOCX
    document = Document()
    new_parser = HtmlToDocx()
    # do stuff to document

    new_parser.add_html_to_document(content, document)

    # do more stuff to document
    document.save('output.docx')

#if __name__ == "__main__":
    

    
text = '{"content": "<p>This is some <strong>rich text</strong> content.</p>"}'

try:
    # Read input from the standard input
    #input_data = json.loads(text)
    input_data = json.loads(sys.argv[1])
    content = input_data.get('content', '')

    # Save content to DOCX
    save_to_docx(content)

    # Optional: Return a success message
    print(json.dumps({'status': 'success'}))

except Exception as e:
    # Print an error message if an exception occurs
    print(json.dumps({'status': 'error', 'message': str(e)}), file=sys.stderr)
    sys.exit(1)
