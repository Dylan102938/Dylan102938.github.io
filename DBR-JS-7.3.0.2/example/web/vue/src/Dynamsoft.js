import Dynamsoft from "dynamsoft-javascript-barcode";
Dynamsoft.BarcodeReader.engineResourcePath = "https://cdn.jsdelivr.net/npm/dynamsoft-javascript-barcode@7.3.0-v2/dist/";
// Please visit https://www.dynamsoft.com/CustomerPortal/Portal/TrialLicense.aspx to get a trial license
Dynamsoft.BarcodeReader.productKeys = "t0068NQAAAJ1TkVG5jzSa+27rHrisnx2Z3NcAGt1OYWTTswaAhg25CdBYCUBd/dAkCkJ5WS6O0uYLN3ErRtO7PET3+WrK2zw=";
// Dynamsoft.BarcodeReader._bUseFullFeature = true; // Control of loading min wasm or full wasm.
export default Dynamsoft;
