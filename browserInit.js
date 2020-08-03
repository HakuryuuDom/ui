// CoherentGT ingame browser initialization script for TERA Toolbox
if (window !== undefined && engine !== undefined) {
    window.alert = function (message) { engine.TriggerEvent.apply(engine, ['alert', message]); }
    engine.BindingsReady(2, 7, 0, 3);
}
