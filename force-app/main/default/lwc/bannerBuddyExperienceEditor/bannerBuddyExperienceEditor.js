import { LightningElement, api } from 'lwc';

const FIELD_DEFAULTS = Object.freeze({
    mode: 'sticky',
    tokenPreset: 'default',
    stickyTopOffset: '10px',
    stickyWidth: '90%',
    stickyMaxWidth: '800px',
    stickyBorderRadius: '20px',
    stickyShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    tickerBackgroundColor: '#0f172a',
    tickerTextColor: '#f8fafc',
    tickerEdgeFadeColor: '#0f172a',
    tickerEdgeFadeWidth: '4.5rem',
    tickerSpeedSeconds: 28,
    infoColor: '#6d5bf6',
    errorColor: '#c23934',
    warningColor: '#ff9e2c',
    successColor: '#08ca4a'
});

export default class BannerBuddyExperienceEditor extends LightningElement {
    /* ── Property Editor Contract ── */
    @api label;
    @api description;
    @api required;
    @api errors;
    @api schema;

    _value = {};

    @api
    get value() {
        return this._value;
    }

    set value(val) {
        this._value = val && typeof val === 'object' ? { ...val } : {};
    }

    /* ── Combobox options ── */
    modeOptions = [
        { label: 'Sticky', value: 'sticky' },
        { label: 'Ticker', value: 'ticker' }
    ];

    presetOptions = [
        { label: 'Default', value: 'default' },
        { label: 'Compact', value: 'compact' },
        { label: 'Broadcast', value: 'broadcast' }
    ];

    /* ── Computed getters ── */
    get currentMode() {
        return this._value?.mode || FIELD_DEFAULTS.mode;
    }

    get currentPreset() {
        return this._value?.tokenPreset || FIELD_DEFAULTS.tokenPreset;
    }

    get isStickyMode() {
        return this.currentMode === 'sticky';
    }

    get isTickerMode() {
        return this.currentMode === 'ticker';
    }

    get stickyTopOffset() {
        return this._value?.stickyTopOffset ?? FIELD_DEFAULTS.stickyTopOffset;
    }

    get stickyWidth() {
        return this._value?.stickyWidth ?? FIELD_DEFAULTS.stickyWidth;
    }

    get stickyMaxWidth() {
        return this._value?.stickyMaxWidth ?? FIELD_DEFAULTS.stickyMaxWidth;
    }

    get stickyBorderRadius() {
        return this._value?.stickyBorderRadius ?? FIELD_DEFAULTS.stickyBorderRadius;
    }

    get stickyShadow() {
        return this._value?.stickyShadow ?? FIELD_DEFAULTS.stickyShadow;
    }

    get tickerBackgroundColor() {
        return this._value?.tickerBackgroundColor ?? FIELD_DEFAULTS.tickerBackgroundColor;
    }

    get tickerTextColor() {
        return this._value?.tickerTextColor ?? FIELD_DEFAULTS.tickerTextColor;
    }

    get tickerEdgeFadeColor() {
        return this._value?.tickerEdgeFadeColor ?? FIELD_DEFAULTS.tickerEdgeFadeColor;
    }

    get tickerEdgeFadeWidth() {
        return this._value?.tickerEdgeFadeWidth ?? FIELD_DEFAULTS.tickerEdgeFadeWidth;
    }

    get tickerSpeedSeconds() {
        return this._value?.tickerSpeedSeconds ?? FIELD_DEFAULTS.tickerSpeedSeconds;
    }

    get infoColor() {
        return this._value?.infoColor ?? FIELD_DEFAULTS.infoColor;
    }

    get errorColor() {
        return this._value?.errorColor ?? FIELD_DEFAULTS.errorColor;
    }

    get warningColor() {
        return this._value?.warningColor ?? FIELD_DEFAULTS.warningColor;
    }

    get successColor() {
        return this._value?.successColor ?? FIELD_DEFAULTS.successColor;
    }

    get hasErrors() {
        return Array.isArray(this.errors) && this.errors.length > 0;
    }

    get errorMessages() {
        if (!this.hasErrors) {
            return [];
        }
        return this.errors.map((err, idx) => ({
            key: `err-${idx}`,
            message: err.message || String(err)
        }));
    }

    /* ── Event handlers ── */
    handleModeChange(event) {
        this.updateField('mode', event.detail.value);
    }

    handlePresetChange(event) {
        this.updateField('tokenPreset', event.detail.value);
    }

    handleFieldBlur(event) {
        const field = event.target.dataset.field;
        if (!field) {
            return;
        }
        const raw = event.target.value;
        if (field === 'tickerSpeedSeconds') {
            const parsed = parseInt(raw, 10);
            this.updateField(field, Number.isFinite(parsed) ? parsed : FIELD_DEFAULTS[field]);
        } else {
            this.updateField(field, raw);
        }
    }

    updateField(fieldName, fieldValue) {
        const next = { ...this._value, [fieldName]: fieldValue };
        this._value = next;
        this.dispatchEvent(
            new CustomEvent('valuechange', {
                detail: { value: next }
            })
        );
    }
}
