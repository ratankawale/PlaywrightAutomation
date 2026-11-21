import ExcelJS from 'exceljs';

export class ExcelUtils {

    static async getRowData(
        filePath: string,
        sheetName: string,
        rowNumber: number
    ): Promise<Record<string, string>> {

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(filePath);

        const worksheet = workbook.getWorksheet(sheetName);

        if (!worksheet) {
            throw new Error(`Sheet ${sheetName} not found`);
        }

        const headers: string[] = [];
        const headerRow = worksheet.getRow(1);

        headerRow.eachCell((cell, colNumber) => {
            headers[colNumber - 1] = String(cell.value);
        });

        const row = worksheet.getRow(rowNumber + 1);

        const data: Record<string, string> = {};

        headers.forEach((header, index) => {
            data[header] = String(row.getCell(index + 1).value ?? '');
        });

        return data;
    }
}