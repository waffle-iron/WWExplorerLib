/* 
 * Copyright (c) 2016 Bruce Schubert.
 * The MIT License
 * http://www.opensource.org/licenses/mit-license
 */

/*global require, requirejs, WorldWind */

/**
 * Require.js bootstrapping javascript
 */
requirejs.config({
// Path mappings for the logical module names
    paths: {
        'knockout': '../node_modules/knockout/build/output/knockout-latest.debug',
        'jquery': '../node_modules/jquery/dist/jquery',
        'jqueryui': 'libs/jquery-ui/jquery-ui-1.11.4',
        'jquery-growl': 'libs/jquery-plugins/jquery.growl',
        'moment': '../node_modules/moment/moment',
        'worldwind': 'libs/webworldwind/worldwind',
        'model': 'model' // root application path
    }
});

/**
 * A top-level require call executed by the Application.
 */
require(['knockout', 'jquery', 'worldwind',
    'model/Config',
    'model/Constants',
    'model/Explorer',
    'model/globe/Globe',
    'views/GlobeViewModel',
    'views/LayersViewModel',
    'views/MarkerEditor',
    'views/MarkersViewModel',
    'views/ProjectionsViewModel',
    'views/SearchViewModel',
    'views/SettingsViewModel',
    'model/globe/layers/UsgsContoursLayer',
    'model/globe/layers/UsgsImageryTopoBaseMapLayer',
    'model/globe/layers/UsgsTopoBaseMapLayer'],
    function (ko, $, ww,
        config,
        constants,
        explorer,
        Globe,
        GlobeViewModel,
        LayersViewModel,
        MarkerEditor,
        MarkersViewModel,
        ProjectionsViewModel,
        SearchViewModel,
        SettingsViewModel,
        UsgsContoursLayer,
        UsgsImageryTopoBaseMapLayer,
        UsgsTopoBaseMapLayer) { // this callback gets executed when all required modules are loaded
        "use strict";
        // ----------------
        // Setup the globe
        // ----------------
        WorldWind.Logger.setLoggingLevel(WorldWind.Logger.LEVEL_WARNING);
        WorldWind.configuration.baseUrl = ww.WWUtil.currentUrlSansFilePart() + "/" + constants.WORLD_WIND_PATH;

        // Define the configuration for the primary globe
        var globeOptions = {
            showBackground: true,
            showReticule: true,
            showViewControls: true,
            includePanControls: config.showPanControl,
            includeRotateControls: true,
            includeTiltControls: true,
            includeZoomControls: true,
            includeExaggerationControls: config.showExaggerationControl,
            includeFieldOfViewControls: config.showFieldOfViewControl
        },
            globe;

        // Create the explorer's primary globe that's associated with the specified HTML5 canvas
        globe = new Globe(new WorldWind.WorldWindow("canvasOne"), globeOptions);

        // Define the Globe's layers and layer options
        globe.layerManager.addBaseLayer(new WorldWind.BMNGLayer(), {enabled: true, hideInMenu: true, detailHint: config.imageryDetailHint});
        globe.layerManager.addBaseLayer(new WorldWind.BMNGLandsatLayer(), {enabled: false, detailHint: config.imageryDetailHint});
        globe.layerManager.addBaseLayer(new WorldWind.BingAerialWithLabelsLayer(null), {enabled: true, detailHint: config.imageryDetailHint});
        globe.layerManager.addBaseLayer(new UsgsImageryTopoBaseMapLayer(), {enabled: false, detailHint: config.imageryDetailHint});
        globe.layerManager.addBaseLayer(new UsgsTopoBaseMapLayer(), {enabled: false, detailHint: config.imageryDetailHint});
        globe.layerManager.addBaseLayer(new WorldWind.BingRoadsLayer(null), {enabled: false, opacity: 0.7, detailHint: config.imageryDetailHint});
        //globe.layerManager.addBaseLayer(new WorldWind.OpenStreetMapImageLayer(null), {enabled: false, opacity: 0.7, detailHint: config.imageryDetailHint});

        globe.layerManager.addOverlayLayer(new UsgsContoursLayer(), {enabled: false});

        // Initialize the Explorer object with a Globe to "explore"
        explorer.initialize(globe);

        // --------------------------------------------------------
        // Bind view models to the corresponding HTML elements
        // --------------------------------------------------------
        ko.applyBindings(new GlobeViewModel(globe, {markerManager: explorer.markerManager}), document.getElementById('globe'));
        ko.applyBindings(new SettingsViewModel(), document.getElementById('settomgs'));
        ko.applyBindings(new ProjectionsViewModel(globe), document.getElementById('projections'));
        ko.applyBindings(new SearchViewModel(globe), document.getElementById('search'));
        ko.applyBindings(new LayersViewModel(globe), document.getElementById('layers'));
        ko.applyBindings(new MarkersViewModel(globe, explorer.markerManager), document.getElementById('markers'));
        ko.applyBindings(new MarkerEditor(), document.getElementById('marker-editor'));

        // -----------------------------------------------------------
        // Add handlers to auto-expand/collapse the menus
        // -----------------------------------------------------------
        // Auto-expand menu section-bodies when not small
        $(window).resize(function () {
            if ($(window).width() >= 768) {
                $('.section-body').collapse('show');
            }
        });
        // Auto-collapse navbar when its tab items are clicked
        $('.navbar-collapse a[role="tab"]').click(function () {
            $('.navbar-collapse').collapse('hide');
        });
        // Auto-scroll-into-view expanded dropdown menus
        $('.dropdown').on('shown.bs.dropdown', function (event) {
            event.target.scrollIntoView(false); // align to bottom
        });

        // ------------------------------------------------------------
        // Add handlers to save/restore the session
        // -----------------------------------------------------------
        // Add event handler to save the current view (eye position) and markers when the window closes
        window.onbeforeunload = function () {
            explorer.saveSession();
            // Return null to close quietly on Chrome and FireFox.
            return null;
        };

        // Now that MVC is set up, restore the model from the previous session.
        explorer.restoreSession();
    }
);
