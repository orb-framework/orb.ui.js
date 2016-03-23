// define the namespaces
window.orb = window.orb || {};
window.orb.ui = new Backbone.Model({
    shiftKey: false,
    metaKey: false,
    altKey: false,
    ctrlKey: false,
});

window.orb.ui.inputType = function (column_type) {
    switch (column_type) {
        //case 'Boolean':
        //    return Wood.Checkbox;
        default:
            return Wood.Input;
    }
};

// include the UI components
require('./querybuilder/all');
require('./editor/all');
require('./modelpicker');
require('./modeldialog');
require('./table');

// create global registry
$(document).mousemove(function (event) {
    var $orb = $('.orb');
    if (event.shiftKey) {
        $orb.addClass('shift-pressed');
        orb.ui.set('shiftKey', true);
    } else {
        $orb.removeClass('shift-pressed');
        orb.ui.set('shiftKey', false);
    }
    
    if (event.metaKey) {
        $orb.addClass('meta-pressed');
        orb.ui.set('metaKey', true);
    } else {
        $orb.removeClass('meta-pressed');
        orb.ui.set('metaKey', false);
    }
    
    if (event.altKey) {
        $orb.addClass('alt-pressed');
        orb.ui.set('altKey', true);
    } else {
        $orb.removeClass('alt-pressed');
        orb.ui.set('altKey', false);
    }
    
    if (event.controlKey) {
        $orb.addClass('ctrl-pressed');
        orb.ui.set('ctrlKey', true);
    } else {
        $orb.removeClass('ctrl-pressed');
        orb.ui.set('ctrlKey', false);
    }
});