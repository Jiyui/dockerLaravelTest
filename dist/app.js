"use strict";

var _express = _interopRequireDefault(require("express"));
var _bodyParser = _interopRequireDefault(require("body-parser"));
var _pdfLib = require("pdf-lib");
var _nodeSignpdf = _interopRequireDefault(require("node-signpdf"));
var _helpers = require("node-signpdf/dist/helpers");
var _fs = require("fs");
var _nanoid = require("nanoid");
var _dayjs = _interopRequireDefault(require("dayjs"));
var _qrcode = _interopRequireDefault(require("qrcode"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }
function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return typeof key === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (typeof input !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (typeof res !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
const {
  createCanvas,
  loadImage
} = require('canvas');
const app = (0, _express.default)();
app.use(_bodyParser.default.json()); // to support JSON-encoded bodies
app.use(_bodyParser.default.urlencoded({
  // to support URL-encoded bodies
  extended: true
}));
const STORAGE = `${process.cwd()}\\.\\storage\\app\\public`;
const PORT = process.env.PORT || 3000;
const generateSignatureImage = async ({
  signPath,
  qrText
}) => {
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
  _qrcode.default.toCanvas(qrCanvas, JSON.stringify(qrText), {
    margin: 1,
    errorCorrectionLevel: "L"
  }, function (error) {
    if (error) console.error(error);
  });
  ctx.drawImage(qrCanvas, canvasHeight - qrSize, canvasWidth - qrSize, qrSize, qrSize);
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 24px Arial';
  ctx.fillText('Digitally signed by', 250, 25);
  ctx.fillText(qrText.subject["CN"], 250, 50, 225);
  ctx.fillText('Date:' + qrText.documentSigned.date, 250, 75);
  ctx.fillText('Time:' + qrText.documentSigned.time, 250, 100);
  const buffer = canvas.toBuffer('image/png');
  return buffer;
};
const attachSignature = async ({
  pdfFile,
  signImage
}) => {
  const formPdfBytes = (0, _fs.readFileSync)(`${STORAGE}\\${pdfFile}`);
  const signatureImageBytes = signImage;
  const pdfDoc = await _pdfLib.PDFDocument.load(formPdfBytes);
  const pages = pdfDoc.getPages();
  const page = pages[pages.length - 1];
  const signatureImage = await pdfDoc.embedPng(signatureImageBytes);
  const pngDims = signatureImage.scale(0.4);
  page.drawImage(signatureImage, {
    x: 50,
    y: 60,
    width: pngDims.width,
    height: pngDims.height
  });
  const pdfBytes = await pdfDoc.save({
    useObjectStreams: false
  });
  return Buffer.from(pdfBytes);
};
const signPdf = async ({
  pdf,
  certFile,
  passphrase
}) => {
  const PATH_TO_P12_CERTIFICATE = `${STORAGE}\\${certFile}`;
  const PASS_PHRASE = passphrase;
  const signedPdfFileName = `signed-${(0, _nanoid.nanoid)(20)}.pdf`;
  const certBuffer = (0, _fs.readFileSync)(PATH_TO_P12_CERTIFICATE);
  let pdfBuffer = pdf;
  const pathSignedPdf = `${STORAGE}\\${signedPdfFileName}`;
  pdfBuffer = (0, _helpers.plainAddPlaceholder)({
    pdfBuffer,
    reason: "Sample PDF signing"
  });
  pdfBuffer = await _nodeSignpdf.default.sign(pdfBuffer, certBuffer, {
    passphrase: PASS_PHRASE,
    asn1StrictParsing: true
  });
  const bufferPdf = Buffer.from(pdfBuffer);
  (0, _fs.writeFileSync)(pathSignedPdf, bufferPdf);
  return signedPdfFileName;
};
app.post('/', async (req, res) => {
  const pdfFile = req.body.pdfFile;
  const signFile = req.body.signFile;
  const certFile = req.body.certFile;
  const password = req.body.password;
  const certInfo = req.body.certInfo;
  const qrText = _objectSpread(_objectSpread({}, certInfo), {}, {
    documentSigned: {
      date: (0, _dayjs.default)().format('YYYY.MM.DD'),
      time: (0, _dayjs.default)().format('hh:mm A')
    }
  });
  const signImage = await generateSignatureImage({
    signPath: signFile,
    qrText
  });
  const pdf = await attachSignature({
    pdfFile,
    signImage
  });
  const signedPdfFileName = await signPdf({
    pdf,
    certFile,
    passphrase: password
  });
  return res.json({
    status: true,
    files: {
      signedPdf: signedPdfFileName
    }
  });
});
app.listen(PORT, () => console.log(`App listening at port ${PORT}`));