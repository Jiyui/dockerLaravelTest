import express from 'express';
import bodyParser from 'body-parser';
import { PDFDocument } from 'pdf-lib';
import signer from 'node-signpdf';
import { plainAddPlaceholder } from 'node-signpdf/dist/helpers';
import { readFileSync, writeFileSync } from 'fs';
import { nanoid } from 'nanoid';
import dayjs from 'dayjs';
import qrcode from 'qrcode';

const { createCanvas, loadImage } = require('canvas');

const app = express();

app.use(bodyParser.json());       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
    extended: true
}));

const STORAGE = `${process.cwd()}\\.\\storage\\app\\public`;

const PORT = process.env.PORT || 3000;

const generateSignatureImage = async ({signPath, qrText }) => {
    const signImage = await loadImage(`${STORAGE}\\${signPath}`);
  
    const canvasHeight = 625;
    const canvasWidth = 150;
    const canvas = createCanvas(canvasHeight, canvasWidth);
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvasHeight, canvasWidth);
    
    ctx.drawImage(signImage, 0, 0, 240, canvasWidth);
    
    const qrSize = 150;
    const qrCanvas = createCanvas(qrSize, qrSize);
    
    qrcode.toCanvas(qrCanvas, JSON.stringify(qrText), {margin: 1, errorCorrectionLevel: "L"}, function (error) {
        if (error) console.error(error)
    })
    
    ctx.drawImage(qrCanvas, canvasHeight-qrSize, canvasWidth-qrSize, qrSize, qrSize);

    ctx.fillStyle = '#000000';
    ctx.font = 'bold 24px Arial';
    ctx.fillText('Digitally signed by', 250, 25);
    ctx.fillText(qrText.subject["CN"], 250, 50, 225);
    ctx.fillText('Date:' + qrText.documentSigned.date, 250, 75);
    ctx.fillText('Time:' + qrText.documentSigned.time, 250, 100);

    const buffer = canvas.toBuffer('image/png');

    return buffer;
}

const attachSignature = async ({pdfFile, signImage}) => {

    const formPdfBytes = readFileSync(`${STORAGE}\\${pdfFile}`);
    const signatureImageBytes = signImage;
  
    const pdfDoc = await PDFDocument.load(formPdfBytes);

    const pages = pdfDoc.getPages();

    const page = pages[pages.length - 1];
  
    const signatureImage = await pdfDoc.embedPng(signatureImageBytes)

    const pngDims = signatureImage.scale(0.4);

    page.drawImage(signatureImage, {
        x: 50,
        y: 60,
        width: pngDims.width,
        height: pngDims.height,
    })
    
    const pdfBytes = await pdfDoc.save({ useObjectStreams: false });
    return Buffer.from(pdfBytes);
}

const signPdf = async ({pdf, certFile, passphrase}) => {
    const PATH_TO_P12_CERTIFICATE = `${STORAGE}\\${certFile}`;
    const PASS_PHRASE = passphrase;

    const signedPdfFileName = `signed-${nanoid(20)}.pdf`;

    const certBuffer = readFileSync(PATH_TO_P12_CERTIFICATE);

    let pdfBuffer = pdf;
    const pathSignedPdf = `${STORAGE}\\${signedPdfFileName}`;
    pdfBuffer = plainAddPlaceholder({ pdfBuffer, reason: "Sample PDF signing" });
    pdfBuffer = await signer.sign(pdfBuffer, certBuffer, {
        passphrase: PASS_PHRASE,
        asn1StrictParsing : true
    });

    const bufferPdf = Buffer.from(pdfBuffer);
    writeFileSync(pathSignedPdf, bufferPdf);

    return signedPdfFileName;
}

app.post('/', async (req, res) => {
    const pdfFile = req.body.pdfFile;
    const signFile = req.body.signFile;
    const certFile = req.body.certFile;
    const password = req.body.password;
    const certInfo = req.body.certInfo;
    const qrText = {
        ...certInfo,
        documentSigned: {
            date: dayjs().format('YYYY.MM.DD'),
            time: dayjs().format('hh:mm A')
        },
    };

    const signImage = await generateSignatureImage({signPath: signFile, qrText});

    const pdf = await attachSignature({pdfFile, signImage});

    const signedPdfFileName = await signPdf({
        pdf,
        certFile,
        passphrase: password,
    });

    return res.json({
        status: true,
        files: {
            signedPdf: signedPdfFileName,
        }
    });
});

app.listen(PORT, () => console.log(`App listening at port ${PORT}`));