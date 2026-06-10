sap.ui.define([
    "sap/ui/core/mvc/Controller"
], (Controller) => {
    "use strict";

    return Controller.extend("co.mitsubishi.flujotelefoniacelular.controller.Main", {
        onInit() {
            this.getView().addEventDelegate({
                onAfterRendering: this._showMasterPage.bind(this)
            });
        },

        _showMasterPage() {
            const oSplitApp = this.byId("splitApp");
            const aMasterPages = oSplitApp?.getMasterPages();

            if (oSplitApp && aMasterPages.length) {
                oSplitApp.toMaster(aMasterPages[0]);
            }
        }
    });
});
