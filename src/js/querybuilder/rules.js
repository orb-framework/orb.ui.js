(function (orb) {
    // define commonly reusable rules
    var null_inputs = {
        'is null': {
            op: orb.Q.Op.Is,
            value: null,
            matches: function (model) { return (model.get('op') === orb.Q.Op.Is && model.get('value') === null); }
        },
        'is not null': {
            op: orb.Q.Op.IsNot,
            value: null,
            matches: function (model) { return (model.get('op') === orb.Q.Op.IsNot && model.get('value') === null); }
        }
    };

    var basic_inputs = {
        'is': {
            op: orb.Q.Op.Is,
            editor: orb.ui.QueryBuilder.Editors.InputField
        },
        'is not': {
            op: orb.Q.Op.IsNot,
            editor: orb.ui.QueryBuilder.Editors.InputField
        }
    };

    var text_inputs = {
        'contains': {
            op: orb.Q.Op.Contains,
            editor: orb.ui.QueryBuilder.Editors.InputField
        },
        'does not contain': {
            op: orb.Q.Op.DoesNotContain,
            editor: orb.ui.QueryBuilder.Editors.InputField
        },
        'starts with': {
            op: orb.Q.Op.Startswith,
            editor: orb.ui.QueryBuilder.Editors.InputField
        },
        'does not start with': {
            op: orb.Q.Op.DoesNotStartwith,
            editor: orb.ui.QueryBuilder.Editors.InputField
        },
        'ends with': {
            op: orb.Q.Op.Startswith,
            editor: orb.ui.QueryBuilder.Editors.InputField
        },
        'does not end with': {
            op: orb.Q.Op.DoesNotEndwith,
            editor: orb.ui.QueryBuilder.Editors.InputField
        },
        'matches': {
            op: orb.Q.Op.Matches,
            editor: orb.ui.QueryBuilder.Editors.InputField
        },
        'does not match': {
            op: orb.Q.Op.DoesNotMatch,
            editor: orb.ui.QueryBuilder.Editors.InputField
        }
    };

    var bool_inputs = {
        'is': {
            op: orb.Q.Op.Is,
            editor: orb.ui.QueryBuilder.Editors.SelectField,
            options: {
                options: [{
                    value: 'true',
                    display: 'True'
                }, {
                    value: 'false',
                    display: 'False'
                }]
            }
        },
        'is not': {
            op: orb.Q.Op.Is,
            editor: orb.ui.QueryBuilder.Editors.SelectField,
            options: {
                options: [{
                    value: 'true',
                    display: 'True'
                }, {
                    value: 'false',
                    display: 'False'
                }]
            }
        }
    };

    var date_inputs = {
        'is': {
            op: orb.Q.Op.Is,
            editor: orb.ui.QueryBuilder.Editors.DateField
        },
        'is not': {
            op: orb.Q.Op.Is,
            editor: orb.ui.QueryBuilder.Editors.DateField
        },
        'after': {
            op: orb.Q.Op.After,
            editor: orb.ui.QueryBuilder.Editors.DateField
        },
        'before': {
            op: orb.Q.Op.Before,
            editor: orb.ui.QueryBuilder.Editors.DateField
        },
        'between': {
            op: orb.Q.Op.Between,
            editor: orb.ui.QueryBuilder.Editors.BetweenField
        }
    };
    
    var ref_inputs = {
        'is': {
            op: orb.Q.Op.Is,
            editor: orb.ui.QueryBuilder.Editors.InputField
        }
    };

    // define column specific rules
    orb.ui.QueryBuilder.Rules.Id = _.extend({}, basic_inputs, null_inputs);

    orb.ui.QueryBuilder.Rules.Boolean = _.extend({}, bool_inputs, null_inputs);

    orb.ui.QueryBuilder.Rules.String = _.extend({}, basic_inputs, null_inputs, text_inputs);
    orb.ui.QueryBuilder.Rules.Email = _.extend({}, basic_inputs, null_inputs, text_inputs);
    orb.ui.QueryBuilder.Rules.Text = _.extend({}, basic_inputs, null_inputs, text_inputs);
    orb.ui.QueryBuilder.Rules.Html = _.extend({}, basic_inputs, null_inputs, text_inputs);
    orb.ui.QueryBuilder.Rules.Xml = _.extend({}, basic_inputs, null_inputs, text_inputs);

    orb.ui.QueryBuilder.Rules.Date = _.extend({}, date_inputs);
    orb.ui.QueryBuilder.Rules.Datetime = _.extend({}, date_inputs);
    orb.ui.QueryBuilder.Rules.DatetimeWithTimezone = _.extend({}, date_inputs);
    
    orb.ui.QueryBuilder.Rules.Reference = _.extend({}, ref_inputs, null_inputs);

})(window.orb);