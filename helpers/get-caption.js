const xlsx = require('xlsx');
const path = require('path');

function getCaption(filePath, rowIndex) {
    return new Promise((resolve, reject) => {
        try {
            // Read the Excel file
            const workbook = xlsx.readFile(filePath);
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];

            // Get the cell address for the first column of the specified row
            const cellAddress = `A${rowIndex + 1}`;

            // Get the cell value
            const cell = worksheet[cellAddress];
            const caption = cell ? cell.v : null;

            resolve(caption);
        } catch (error) {
            reject(error);
        }
    });
}

module.exports = getCaption;