const importModel = require("../import.model");

exports.insertImport = async ({
  import_productId,
  import_supplier = "",
  import_shopId,
  import_quantity,
  import_purchase,
  import_location = "",
}) => {
  return await importModel.create({
    import_productId,
    import_supplier,
    import_shopId,
    import_quantity,
    import_purchase,
    import_location,
  });
};
