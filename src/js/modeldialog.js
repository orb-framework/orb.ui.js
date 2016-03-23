(function (orb) {
    orb.ui.ModelDialog = Wood.FormDialog.extend({
        initialize: function (options) {
            options = options || {};

            var self = this;
            var schema = this.model.constructor.schema;

            options.submitButton = options.submitButton || 'Submit';

            if (!options.title) {
                var action = this.model.get('id') ? 'Edit' : 'Create';
                options.title = action + ' ' + schema.display;
            }

            if (!options.formOptions) {
                var columns = options.columns || schema.columns;
                var inputs = [];

                _.each(columns, function (column) {
                    if (column.flags.indexOf('ReadOnly') === -1) {
                        var view = orb.ui.inputType(column.type);
                        inputs.push({
                            id: column.name,
                            view: view,
                            options: {
                                floatingLabelText: column.display,
                                isRequired: column.flags.indexOf('Required') !== -1
                            }
                        });
                    }
                });

                options.formOptions = {
                    model: this.model,
                    inputs: inputs
                };
            }

            if (!options.onSubmit) {
                options.onSubmit = function(dialog, form, data){
                    form.onPost();
                    self.model.save(data, {
                        success: function(record) {
                            form.onSuccess();
                            dialog.close();
                            self.render();
                        },
                        error: function(user){
                            form.onError();
                        }
                    });
                }
            }

            Wood.FormDialog.prototype.initialize.call(this, options);
        }

    });
})(window.orb);