var LabsHostViewModel = (function () {
    function LabsHostViewModel(mode, initialLab) {
        var _this = this;
        this._version = { major: 0, minor: 1 };
        this._labState = new Labs.InMemoryLabState();
        this.attemptMap = {};
        this._nextId = 0;
        this.active = ko.observable(false);
        this.mode = ko.observable(mode);
        this.consoleEntries = ko.observableArray();
        this.createHostVersion = ko.observable();

        this.labUriEntry = ko.observable(initialLab);
        this.labUri = initialLab ? ko.observable(initialLab) : ko.observable();
        this.actions = ko.observable(JSON.stringify([]));
        this.results = ko.computed(function () {
            var actions = _this.actions();
            return JSON.parse(actions);
        });

        this.configuration = ko.observable(null);
        this.configurationInstance = ko.observable(null);
        this.state = ko.observable(null);

        this.actions.subscribe(function (newActions) {
            _this._labState.setActions(JSON.parse(newActions));
        });

        this.state.subscribe(function (newState) {
            _this._labState.setState(JSON.parse(newState));
        });

        this.configuration.subscribe(function (newConfiguration) {
            _this._labState.setConfiguration(JSON.parse(newConfiguration));
            _this.configurationInstance(JSON.stringify(_this._labState.getConfigurationInstance()));
        });

        this._server = new LabsServer.LabHost("test", this);
        this._server.start();
    }
    LabsHostViewModel.prototype.loadLab = function () {
        this.log("Loading: " + this.labUriEntry());
        this.labUri(this.labUriEntry());
    };

    LabsHostViewModel.prototype.setEditMode = function () {
        var _this = this;
        var editModeString = Labs.Core.LabMode[Labs.Core.LabMode.Edit];

        if (this.mode() !== editModeString) {
            this.mode(Labs.Core.LabMode[Labs.Core.LabMode.Edit]);
            this.log("Setting Edit Mode");
            var promise = this._server.sendMessage(new Labs.Command(Labs.CommandType.ModeChanged, { mode: editModeString }));
            promise.done(function () {
                _this.log("Mode Set");
            });
        }
    };

    LabsHostViewModel.prototype.setActive = function () {
        if (!this.active()) {
            this.active(true);
            this._server.setActive(true);
        }
    };

    LabsHostViewModel.prototype.setDeactive = function () {
        if (this.active()) {
            this.active(false);
            this._server.setActive(false);
        }
    };

    LabsHostViewModel.prototype.setViewMode = function () {
        var _this = this;
        var viewModeString = Labs.Core.LabMode[Labs.Core.LabMode.View];

        if (this.mode() !== viewModeString) {
            this.mode(viewModeString);
            this.log("Setting View Mode");
            var promise = this._server.sendMessage(new Labs.Command(Labs.CommandType.ModeChanged, { mode: viewModeString }));
            promise.done(function () {
                _this.log("Mode Set");
            });
        }
    };

    LabsHostViewModel.prototype.log = function (entry) {
        this.consoleEntries.push(entry);
    };

    LabsHostViewModel.prototype.handleConnect = function (versionInfo) {
        var hostVersion = this.createHostVersion() ? JSON.parse(this.createHostVersion()) : null;

        var connectionResponse = {
            initializationInfo: {
                hostVersion: hostVersion
            },
            hostVersion: this._version,
            userInfo: {
                id: "TestUserId",
                permissions: [
                    Labs.Core.Permissions.Edit,
                    Labs.Core.Permissions.Take
                ]
            },
            applicationId: "TestAppId",
            mode: Labs.Core.LabMode[this.mode()]
        };

        return $.when(connectionResponse);
    };

    LabsHostViewModel.prototype.handleDisconnect = function (completionStatus) {
        return $.when();
    };

    LabsHostViewModel.prototype.handleGetConfiguration = function () {
        return $.when(this._labState.getConfiguration());
    };

    LabsHostViewModel.prototype.handleSetConfiguration = function (configuration) {
        this._labState.setConfiguration(configuration);
        this.configuration(JSON.stringify(configuration));

        this.state(this._labState.getState());
        this.actions(JSON.stringify(this._labState.getAllActions()));
        this.configurationInstance(JSON.stringify(this._labState.getConfigurationInstance()));

        return $.when();
    };

    LabsHostViewModel.prototype.handleGetState = function () {
        return $.when(this._labState.getState());
    };

    LabsHostViewModel.prototype.handleSetState = function (state) {
        this._labState.setState(state);
        this.state(JSON.stringify(state));
        return $.when();
    };

    LabsHostViewModel.prototype.handleCreate = function (options) {
        this.createHostVersion(JSON.stringify(this._version));
        return $.when();
    };

    LabsHostViewModel.prototype.handleGetConfigurationInstance = function () {
        return $.when(this._labState.getConfigurationInstance());
    };

    LabsHostViewModel.prototype.handleTakeAction = function (commandData) {
        var completedAction = this._labState.takeAction(commandData.type, commandData.options, commandData.result);
        this.actions(JSON.stringify(this._labState.getAllActions()));
        return $.when(completedAction);
    };

    LabsHostViewModel.prototype.handleGetActions = function (commandData) {
        var completedActions = this._labState.getActions(commandData.type, commandData.options);
        return $.when(completedActions);
    };

    LabsHostViewModel.prototype.handleSendMessage = function (messageData) {
        this.log(JSON.stringify(messageData));
        return $.when();
    };
    return LabsHostViewModel;
})();
//# sourceMappingURL=labshost.js.map
