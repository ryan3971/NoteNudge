import datetime
from docx import Document

def append_entry_to_word_doc(entry_text):
    # Get the current date and Monday of the current week
    today = datetime.date.today()
    monday = today - datetime.timedelta(days=today.weekday())

    # Format the headings
    week_heading = f"Week of {monday.strftime('%B %d')}"
    weekday_heading = today.strftime('%A')
    entry_number_heading = f"Entry #{get_entry_number()}"

    # Open the word document
    doc = Document('path/to/your/document.docx')

    # Find or create the appropriate headings
    week_heading_found = False
    for paragraph in doc.paragraphs:
        if paragraph.text == week_heading:
            week_heading_found = True
            break

    if not week_heading_found:
        doc.add_heading(week_heading, level=1)

    doc.add_heading(weekday_heading, level=2)
    doc.add_heading(entry_number_heading, level=3)

    # Append the entry text
    doc.add_paragraph(entry_text)

    # Save and close the document
    doc.save('path/to/your/document.docx')
    doc.close()

def get_entry_number():
    # Implement your logic to retrieve the entry number
    # This could involve reading from a file or database
    # and incrementing the value accordingly
    pass
