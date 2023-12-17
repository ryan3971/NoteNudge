const fs = require('fs');
const docx = require('docx');
const { Document, Packer, Paragraph, TextRun, HeadingLevel } = require("docx");

// Function to get the current week's Monday
function getMonday() {
  const today = new Date();
  const monday = new Date(today);
  monday.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1));
  return monday;
}

// Function to get the current entry number (replace this with your actual implementation)
function getEntryNumber() {
  return 1; // For example, assuming the entry number is always 1 for simplicity
}

// Get the current date and Monday of the current week
const today = new Date();
const monday = getMonday();

// Format the headings
const weekHeading = `Week of ${monday.toLocaleString('default', { month: 'long' })} ${monday.getDate()}`;
const weekdayHeading = today.toLocaleString('default', { weekday: 'long' });
const entryNumberHeading = `Entry #${getEntryNumber()}`;

// Load the existing document, if it exists
const existingDocPath = 'path/to/your/document.docx';
let existingDoc = null;
// if (fs.existsSync(existingDocPath)) {
//   existingDoc = new Document(fs.readFileSync(existingDocPath));
// }

const doc = new docx.Document({
    creator: "Dolan Miu",
    description: "My extremely interesting document",
    title: "My Document",
});

// Find or create the appropriate headings
let weekHeadingFound = false;
if (existingDoc) {
  existingDoc.sections.forEach((section) => {
    section.children.forEach((element) => {
      if (element.text === weekHeading) {
        weekHeadingFound = true;
      }
    });
  });
}

// If week heading not found, add it
if (!weekHeadingFound) {
  doc.addSection({
    properties: {},
    children: [
      new Paragraph({
        children: [
          new TextRun(weekHeading).heading(HeadingLevel.HEADING_1),
        ],
      }),
    ],
  });
}

// Add new content
doc.addSection({
  properties: {},
  children: [
    new Paragraph({
      children: [
        new TextRun(weekdayHeading).heading(HeadingLevel.HEADING_2),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun(entryNumberHeading).heading(HeadingLevel.HEADING_3),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun('Your entry text goes here'),
      ],
    }),
  ],
});

// Save the document
Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync(existingDocPath, buffer);
  console.log(`Document saved to: ${existingDocPath}`);
});
