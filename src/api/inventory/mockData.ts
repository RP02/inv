import { catalogFromCsvRows } from "./csvInventory";
import { parseCsvText } from "./fileSystemCsv";
import { Catalog } from "./types";

/** Embedded mock CSV (normalized: one row per vendor offer). */
export const MOCK_CSV = `sku,name,category,imageUrl,notes,unit,preferredQty,vendor,vendorSku,unitPrice,moq,shippingFlat,shippingPerUnit,leadDays,url,lastChecked
NP-001,Nitrile Gloves M,PPE,,Powder-free box of 100,box,10,MedSupply Co,MS-NG-M,8.50,1,12.00,0,3,,2026-07-01
NP-001,Nitrile Gloves M,PPE,,Powder-free box of 100,box,10,BulkSafe,BS-NIT-M,7.25,20,0,0.15,7,,2026-07-10
NP-001,Nitrile Gloves M,PPE,,Powder-free box of 100,box,10,Amazon Biz,B0GLOVEM,9.99,1,0,0,1,https://example.com/gloves,2026-08-01
NP-002,Nitrile Gloves L,PPE,,Powder-free box of 100,box,10,MedSupply Co,MS-NG-L,8.75,1,12.00,0,3,,2026-07-01
NP-002,Nitrile Gloves L,PPE,,Powder-free box of 100,box,10,BulkSafe,BS-NIT-L,7.40,20,0,0.15,7,,2026-07-10
CS-100,Clear Cups 16oz,Packaging,,1000/case,case,2,PackRight,PR-C16,42.00,1,25.00,0,5,,2026-06-15
CS-100,Clear Cups 16oz,Packaging,,1000/case,case,2,Restaurant Depot,RD-CUP16,38.50,1,0,0,0,,2026-08-01
CS-100,Clear Cups 16oz,Packaging,,1000/case,case,2,WebPack,WP-16CLR,35.00,5,40.00,0,10,,2026-07-20
CS-110,Cup Lids 16oz,Packaging,,1000/case,case,2,PackRight,PR-L16,28.00,1,25.00,0,5,,2026-06-15
CS-110,Cup Lids 16oz,Packaging,,1000/case,case,2,Restaurant Depot,RD-LID16,24.00,1,0,0,0,,2026-08-01
TR-200,Paper Trays #2,Packaging,,500/case,case,3,PackRight,PR-T2,55.00,1,20.00,0,4,,2026-07-05
TR-200,Paper Trays #2,Packaging,,500/case,case,3,GreenServe,GS-TR2,49.00,3,15.00,0,8,,2026-07-18
CL-300,All-Purpose Cleaner 1gal,Janitorial,,Concentrate,jug,4,CleanPro,CP-APC1,11.25,1,18.00,0,2,,2026-06-20
CL-300,All-Purpose Cleaner 1gal,Janitorial,,Concentrate,jug,4,Sysco,SYS-CLN,10.50,6,0,0,1,,2026-08-02
CL-300,All-Purpose Cleaner 1gal,Janitorial,,Concentrate,jug,4,Walmart Biz,WMT-APC,12.99,1,0,0,2,,2026-07-28
CL-310,Disinfectant Wipes,Janitorial,,75-count canister,can,12,CleanPro,CP-WIP75,6.50,1,15.00,0,2,,2026-06-20
CL-310,Disinfectant Wipes,Janitorial,,75-count canister,can,12,BulkSafe,BS-WIP,5.10,24,0,0.10,6,,2026-07-12
FO-400,Canola Oil 35lb,Food,,Frying oil,jug,2,Sysco,SYS-OIL35,48.00,1,0,0,1,,2026-08-01
FO-400,Canola Oil 35lb,Food,,Frying oil,jug,2,Restaurant Depot,RD-OIL35,44.50,1,0,0,0,,2026-08-01
FO-400,Canola Oil 35lb,Food,,Frying oil,jug,2,US Foods,USF-CAN35,46.25,2,30.00,0,3,,2026-07-22
FO-410,Fryer Filter Paper,Food,,100 sheets,pack,5,Sysco,SYS-FFP,22.00,1,0,0,1,,2026-08-01
FO-410,Fryer Filter Paper,Food,,100 sheets,pack,5,WebPack,WP-FFP,18.75,5,12.00,0,5,,2026-07-15
EQ-500,Bar Towels Blue,Linens,,Dozen,dz,6,MedSupply Co,MS-TOW,14.00,1,10.00,0,4,,2026-06-10
EQ-500,Bar Towels Blue,Linens,,Dozen,dz,6,BulkSafe,BS-TOW-B,11.50,12,0,0.20,8,,2026-07-01
EQ-510,Cutting Board 18x24,Equipment,,HDPE white,ea,2,Restaurant Depot,RD-CB1824,28.00,1,0,0,0,,2026-08-01
EQ-510,Cutting Board 18x24,Equipment,,HDPE white,ea,2,WebPack,WP-CB1824,24.50,1,14.00,0,6,,2026-07-08
EQ-510,Cutting Board 18x24,Equipment,,HDPE white,ea,2,Amazon Biz,B0CUT1824,32.99,1,0,0,1,https://example.com/board,2026-07-30
`;

export function getMockCatalog(): Catalog {
  return catalogFromCsvRows(parseCsvText(MOCK_CSV));
}
