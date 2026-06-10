sap.ui.define([], () => {
    "use strict";

    const ACCION = {
        CREAR: "C"
    };

    return {
        ACCION,

        mapUiModelToCreatePayload(oUiModel) {
            return {
                Estado: oUiModel.Estado,
                CreadorSolicitud: oUiModel.CreadorSolicitud,
                TipoSolicitud: oUiModel.TipoSolicitud,
                Solicitante: oUiModel.Solicitante,
                NombreSolicitante: oUiModel.NombreSolicitante,
                Ciudad: oUiModel.Ciudad,
                CentroCosto: oUiModel.CentroCosto,
                Linea: oUiModel.Linea,
                CedulaRespActual: oUiModel.CedulaRespActual,
                NombreRespActual: oUiModel.NombreRespActual,
                CedulaRespNuevo: oUiModel.CedulaRespNuevo,
                NombreRespNuevo: oUiModel.NombreRespNuevo,
                PersonaRecibeSim: oUiModel.PersonaRecibeSim,
                CedulaRecibeSim: oUiModel.CedulaRecibeSim,
                Aprobador: oUiModel.Aprobador,
                ResponsableGestion: oUiModel.ResponsableGestion,
                TipoEquipo: oUiModel.TipoEquipo,
                Observacion: oUiModel.Observacion,
                ObsGestion: oUiModel.ObsGestion || "",
                ObsAprobador: oUiModel.ObsAprobador || "",
                CabToAdjuntoSet: this.mapAdjuntosToPayload(oUiModel.Adjuntos)
            };
        },

        mapCabeceraToUiModel(oData) {
            const aAdjuntos = oData.CabToAdjuntoSet?.results || oData.CabToAdjuntoSet || [];

            return {
                IdSolicitud: oData.IdSolicitud,
                Estado: oData.Estado,
                CreadorSolicitud: oData.CreadorSolicitud,
                TipoSolicitud: oData.TipoSolicitud,
                Solicitante: oData.Solicitante,
                NombreSolicitante: oData.NombreSolicitante,
                Ciudad: oData.Ciudad,
                CentroCosto: oData.CentroCosto,
                Linea: oData.Linea,
                CedulaRespActual: oData.CedulaRespActual,
                NombreRespActual: oData.NombreRespActual,
                CedulaRespNuevo: oData.CedulaRespNuevo,
                NombreRespNuevo: oData.NombreRespNuevo,
                PersonaRecibeSim: oData.PersonaRecibeSim,
                CedulaRecibeSim: oData.CedulaRecibeSim,
                Aprobador: oData.Aprobador,
                ResponsableGestion: oData.ResponsableGestion,
                TipoEquipo: oData.TipoEquipo,
                Observacion: oData.Observacion,
                ObsGestion: oData.ObsGestion,
                ObsAprobador: oData.ObsAprobador,
                Adjuntos: aAdjuntos.map(oAdjunto => ({
                    Nombre: oAdjunto.Nombre,
                    Tipo: oAdjunto.Tipo,
                    Contenido: oAdjunto.Contenido,
                    ID_FLUJO: oAdjunto.ID_FLUJO,
                    Id_Solicitud: oAdjunto.Id_Solicitud,
                    Id_Adjunto: oAdjunto.Id_Adjunto
                }))
            };
        },

        mapFileToAdjunto(oArchivo, sBase64) {
            return {
                Nombre: oArchivo.name,
                Tipo: oArchivo.type,
                Contenido: sBase64,
                ID_FLUJO: 2
            };
        },

        mapAdjuntosToPayload(aAdjuntos) {
            return (aAdjuntos || [])
                .filter(oAdjunto => oAdjunto.Nombre)
                .map(oAdjunto => ({
                    ID_FLUJO: oAdjunto.ID_FLUJO || 2,
                    Tipo: oAdjunto.Tipo,
                    Contenido: oAdjunto.Contenido || "",
                    Nombre: oAdjunto.Nombre
                }));
        },

        mapAccionToPayload(oUiData, sAccion, sObservacion, iPernr) {
            return {
                Id_Solicitud: Number(oUiData.IdSolicitud),
                Accion: sAccion,
                Observacion: sObservacion,
                TipoSolicitud: oUiData.TipoSolicitud,
                Pernr_Responsable: Number(iPernr) || 0,
                Pernr_Creador: Number(oUiData.CreadorSolicitud) || 0,
                EnviarToAdjuntoSet: []
            };
        },

        listFromBackend(aBackendItems) {
            return aBackendItems.map(item => ({
                Id_Solicitud: item.Id_Solicitud,
                CentroCosto: item.Nom_Ceco,
                Solicitante: item.Nom_completo,
                Estado: item.Estado,
                PasoActual: item.Paso_Actual
            }));
        },

        formatStatusText(sStatus) {
            switch (sStatus) {
                case "1":
                    return "En Proceso";
                case "2":
                    return "Rechazado";
                case "3":
                    return "Aprobado";
                default:
                    return sStatus;
            }
        },

        formatStatusState(sStatus) {
            switch (sStatus) {
                case "1":
                    return "None";
                case "2":
                    return "Error";
                case "3":
                    return "Success";
                default:
                    return "None";
            }
        }
    };
});
