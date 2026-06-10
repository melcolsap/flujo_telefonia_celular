sap.ui.define([
    "sap/ui/core/UIComponent",
    "co/mitsubishi/flujotelefoniacelular/model/models",
    "sap/ui/model/json/JSONModel"
], (UIComponent, models, JSONModel) => {
    "use strict";

    return UIComponent.extend("co.mitsubishi.flujotelefoniacelular.Component", {
        metadata: {
            manifest: "json",
            interfaces: [
                "sap.ui.core.IAsyncContentCreation"
            ]
        },

        init() {
            // call the base component's init function
            UIComponent.prototype.init.apply(this, arguments);

            // set the device model
            this.setModel(models.createDeviceModel(), "device");

            // user context
            this._initUserContext();

            // enable routing
            this.getRouter().initialize();
        },

        // ============================
        // User Context
        // ============================
        _initUserContext: async function () {
            const oUserModel = new JSONModel();
            this.setModel(oUserModel, "user");

            const sEmail = sap?.ushell?.Container?.getUser?.()?.getEmail?.() || "carlos.bermudez@melcol.com.co";

            //const sPernr = await this._readPernrRequest(sEmail);
            const sPernr = 1933;
            oUserModel.setData({
                email: sEmail,
                pernr: sPernr
            });
            console.log("Model user: ", oUserModel);
        },

        _readPernrRequest(sEmail) {
            return new Promise((resolve, reject) => {
                const sCorreoEncoded = encodeURIComponent(sEmail);
                
                this.getModel().read("/Consultar_PernrSet(Correo='" + sCorreoEncoded + "')", {
                    success: oData => resolve(oData.Pernr),
                    error: reject
                });
            });
        }

    });
});