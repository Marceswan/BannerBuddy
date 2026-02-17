import { LightningElement, api } from 'lwc';

const DEFAULT_VALUES = Object.freeze({
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
    tickerItemBackgroundColor: 'rgba(255, 255, 255, 0.14)',
    tickerSpeedSeconds: 28,
    infoColor: '#6d5bf6',
    errorColor: '#c23934',
    warningColor: '#ff9e2c',
    successColor: '#08ca4a'
});

const TOKEN_PRESETS = Object.freeze({
    default: {
        stickyTopOffset: '10px',
        stickyWidth: '90%',
        stickyMaxWidth: '800px',
        stickyBorderRadius: '20px',
        stickyShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        tickerBackgroundColor: '#0f172a',
        tickerTextColor: '#f8fafc',
        tickerEdgeFadeColor: '#0f172a',
        tickerEdgeFadeWidth: '4.5rem',
        tickerItemBackgroundColor: 'rgba(255, 255, 255, 0.14)',
        tickerItemBorderRadius: '999px',
        tickerItemGap: '1.25rem',
        tickerPaddingY: '0.65rem',
        tickerItemPadding: '0.3rem 0.75rem',
        tickerSpeedSeconds: 28,
        tickerShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
        tickerBorderRadius: '999px'
    },
    compact: {
        stickyTopOffset: '8px',
        stickyWidth: '96%',
        stickyMaxWidth: '900px',
        stickyBorderRadius: '12px',
        stickyShadow: '0 4px 10px rgba(0, 0, 0, 0.12)',
        tickerBackgroundColor: '#111827',
        tickerTextColor: '#e5e7eb',
        tickerEdgeFadeColor: '#111827',
        tickerEdgeFadeWidth: '3rem',
        tickerItemBackgroundColor: 'rgba(255, 255, 255, 0.1)',
        tickerItemBorderRadius: '10px',
        tickerItemGap: '0.75rem',
        tickerPaddingY: '0.45rem',
        tickerItemPadding: '0.2rem 0.5rem',
        tickerSpeedSeconds: 24,
        tickerShadow: '0 6px 18px rgba(0, 0, 0, 0.16)',
        tickerBorderRadius: '12px'
    },
    broadcast: {
        stickyTopOffset: '14px',
        stickyWidth: '100%',
        stickyMaxWidth: '1200px',
        stickyBorderRadius: '24px',
        stickyShadow: '0 10px 28px rgba(0, 0, 0, 0.22)',
        tickerBackgroundColor: '#020617',
        tickerTextColor: '#ffffff',
        tickerEdgeFadeColor: '#020617',
        tickerEdgeFadeWidth: '6rem',
        tickerItemBackgroundColor: 'rgba(255, 255, 255, 0.18)',
        tickerItemBorderRadius: '999px',
        tickerItemGap: '1.6rem',
        tickerPaddingY: '0.75rem',
        tickerItemPadding: '0.35rem 0.9rem',
        tickerSpeedSeconds: 34,
        tickerShadow: '0 12px 36px rgba(0, 0, 0, 0.28)',
        tickerBorderRadius: '999px'
    }
});

const INTEGER_FIELDS = new Set(['tickerSpeedSeconds']);
const TOKEN_FIELDS = new Set([
    'stickyTopOffset',
    'stickyWidth',
    'stickyMaxWidth',
    'stickyBorderRadius',
    'stickyShadow',
    'tickerBackgroundColor',
    'tickerTextColor',
    'tickerEdgeFadeColor',
    'tickerEdgeFadeWidth',
    'tickerItemBackgroundColor',
    'tickerSpeedSeconds'
]);

export default class BannerBuddyPropertyEditor extends LightningElement {
    _inputVariables = [];
    values = { ...DEFAULT_VALUES };
    overriddenTokenFields = new Set();

    modeOptions = [
        { label: 'Sticky', value: 'sticky' },
        { label: 'Ticker', value: 'ticker' }
    ];

    presetOptions = [
        { label: 'Default', value: 'default' },
        { label: 'Compact', value: 'compact' },
        { label: 'Broadcast', value: 'broadcast' }
    ];

    @api
    get inputVariables() {
        return this._inputVariables;
    }

    set inputVariables(variables) {
        this._inputVariables = Array.isArray(variables) ? variables : [];
        this.overriddenTokenFields = new Set(
            this._inputVariables
                .map((variable) => variable?.name)
                .filter((name) => TOKEN_FIELDS.has(name))
        );
        this.values = this.readValues(this._inputVariables);
        this.applyPresetToNonOverriddenTokens(this.values.tokenPreset);
    }

    @api
    validate() {
        const errors = [];
        const speed = Number(this.resolvedTokens.tickerSpeedSeconds);
        if (!Number.isFinite(speed) || speed < 5 || speed > 180) {
            errors.push({
                key: 'tickerSpeedSeconds',
                errorString: 'Ticker Base Speed (s) must be between 5 and 180.'
            });
        }
        return errors;
    }

    get stickyPreviewCardClass() {
        return this.values.mode === 'sticky' ? 'preview-card preview-card_active' : 'preview-card';
    }

    get tickerPreviewCardClass() {
        return this.values.mode === 'ticker' ? 'preview-card preview-card_active' : 'preview-card';
    }

    get stickyPreviewContainerStyle() {
        const tokens = this.resolvedTokens;
        return `width: min(100%, ${tokens.stickyMaxWidth});`;
    }

    get stickyPreviewBannerStyle() {
        const tokens = this.resolvedTokens;
        const backgroundColor = this.values.infoColor;
        const textColor = this.getReadableTextColor(backgroundColor);
        return [
            `border-radius: ${tokens.stickyBorderRadius}`,
            `box-shadow: ${tokens.stickyShadow}`,
            `background-color: ${backgroundColor}`,
            `color: ${textColor}`
        ].join('; ');
    }

    get tickerPreviewShellStyle() {
        const tokens = this.resolvedTokens;
        return [
            `background-color: ${tokens.tickerBackgroundColor}`,
            `color: ${tokens.tickerTextColor}`,
            `border-radius: ${tokens.tickerBorderRadius}`,
            `box-shadow: ${tokens.tickerShadow}`,
            `--preview-edge-fade-color: ${tokens.tickerEdgeFadeColor}`,
            `--preview-edge-fade-width: ${tokens.tickerEdgeFadeWidth}`
        ].join('; ');
    }

    get tickerPreviewTrackStyle() {
        const tokens = this.resolvedTokens;
        const durationSeconds = Math.max(tokens.tickerSpeedSeconds, this.tickerPreviewItems.length * 6);
        return [
            `--bannerbuddy-preview-duration: ${durationSeconds}s`,
            `padding: ${tokens.tickerPaddingY} 0`
        ].join('; ');
    }

    get tickerPreviewItems() {
        const variants = [
            { variant: 'Info', title: 'Platform updates available', description: 'Review release notes', color: this.values.infoColor },
            { variant: 'Warning', title: 'Maintenance tonight', description: 'Starts at 11:00 PM', color: this.values.warningColor },
            { variant: 'Success', title: 'Deployment complete', description: 'All checks passed', color: this.values.successColor },
            { variant: 'Error', title: 'Service disruption', description: 'Investigating issue', color: this.values.errorColor }
        ];
        return variants.map((item, index) => ({
            ...item,
            key: `preview-${index}`,
            style: this.getTickerPreviewItemStyle(item.color)
        }));
    }

    get tickerPreviewLoopItems() {
        const baseItems = this.tickerPreviewItems;
        return [
            ...baseItems,
            ...baseItems.map((item, index) => ({
                ...item,
                key: `preview-dup-${index}`
            }))
        ];
    }

    get resolvedTokens() {
        const preset = this.getPreset(this.values.tokenPreset);
        return {
            stickyTopOffset: this.resolveTokenField('stickyTopOffset', preset.stickyTopOffset),
            stickyWidth: this.resolveTokenField('stickyWidth', preset.stickyWidth),
            stickyMaxWidth: this.resolveTokenField('stickyMaxWidth', preset.stickyMaxWidth),
            stickyBorderRadius: this.resolveTokenField('stickyBorderRadius', preset.stickyBorderRadius),
            stickyShadow: this.resolveTokenField('stickyShadow', preset.stickyShadow),
            tickerBackgroundColor: this.resolveTokenField('tickerBackgroundColor', preset.tickerBackgroundColor),
            tickerTextColor: this.resolveTokenField('tickerTextColor', preset.tickerTextColor),
            tickerEdgeFadeColor: this.resolveTokenField('tickerEdgeFadeColor', preset.tickerEdgeFadeColor),
            tickerEdgeFadeWidth: this.resolveTokenField('tickerEdgeFadeWidth', preset.tickerEdgeFadeWidth),
            tickerItemBackgroundColor: this.resolveTokenField('tickerItemBackgroundColor', preset.tickerItemBackgroundColor),
            tickerItemBorderRadius: preset.tickerItemBorderRadius,
            tickerItemGap: preset.tickerItemGap,
            tickerPaddingY: preset.tickerPaddingY,
            tickerItemPadding: preset.tickerItemPadding,
            tickerShadow: preset.tickerShadow,
            tickerBorderRadius: preset.tickerBorderRadius,
            tickerSpeedSeconds: Number(this.resolveTokenField('tickerSpeedSeconds', preset.tickerSpeedSeconds))
        };
    }

    handleFieldChange(event) {
        const fieldName = event.target.dataset.field;
        if (!fieldName || !(fieldName in DEFAULT_VALUES)) {
            return;
        }

        let nextValue = this.normalizeValue(fieldName, event.detail?.value ?? event.target.value);
        let dispatchValue = nextValue;

        if (fieldName === 'tokenPreset') {
            this.values = {
                ...this.values,
                tokenPreset: nextValue
            };
            this.applyPresetToNonOverriddenTokens(nextValue);
            this.dispatchFlowValueChangeEvent(fieldName, nextValue);
            return;
        }

        if (TOKEN_FIELDS.has(fieldName)) {
            if (nextValue === '') {
                this.overriddenTokenFields.delete(fieldName);
                const presetValue = this.getPreset(this.values.tokenPreset)[fieldName];
                nextValue = presetValue;
                dispatchValue = INTEGER_FIELDS.has(fieldName) ? Number(presetValue) : '';
            } else {
                this.overriddenTokenFields.add(fieldName);
            }
        }

        this.values = {
            ...this.values,
            [fieldName]: nextValue
        };

        this.dispatchFlowValueChangeEvent(fieldName, dispatchValue);
    }

    handleResetPresetOverrides() {
        const preset = this.getPreset(this.values.tokenPreset);
        const nextValues = {
            ...this.values
        };

        TOKEN_FIELDS.forEach((fieldName) => {
            this.overriddenTokenFields.delete(fieldName);
            const presetValue = preset[fieldName];
            nextValues[fieldName] = presetValue;
            this.dispatchFlowValueChangeEvent(
                fieldName,
                INTEGER_FIELDS.has(fieldName) ? Number(presetValue) : ''
            );
        });

        this.values = nextValues;
    }

    readValues(inputVariables) {
        const nextValues = { ...DEFAULT_VALUES };
        inputVariables.forEach((variable) => {
            const name = variable?.name;
            if (!(name in DEFAULT_VALUES)) {
                return;
            }
            const rawValue = variable?.value;
            if (rawValue === undefined || rawValue === null) {
                return;
            }
            nextValues[name] = this.normalizeValue(name, rawValue);
        });
        return nextValues;
    }

    applyPresetToNonOverriddenTokens(presetName) {
        const preset = this.getPreset(presetName);
        const nextValues = {
            ...this.values
        };
        TOKEN_FIELDS.forEach((fieldName) => {
            if (!this.overriddenTokenFields.has(fieldName)) {
                nextValues[fieldName] = preset[fieldName];
            }
        });
        this.values = nextValues;
    }

    resolveTokenField(fieldName, presetValue) {
        if (!this.overriddenTokenFields.has(fieldName)) {
            return presetValue;
        }
        const configuredValue = this.values[fieldName];
        if (configuredValue === '' || configuredValue === undefined || configuredValue === null) {
            return presetValue;
        }
        return configuredValue;
    }

    getPreset(presetName) {
        const normalized = String(presetName || '').trim().toLowerCase();
        return TOKEN_PRESETS[normalized] || TOKEN_PRESETS.default;
    }

    normalizeValue(fieldName, value) {
        if (fieldName === 'mode') {
            const normalized = String(value || '').trim().toLowerCase();
            return normalized === 'ticker' ? 'ticker' : 'sticky';
        }
        if (fieldName === 'tokenPreset') {
            const normalized = String(value || '').trim().toLowerCase();
            return TOKEN_PRESETS[normalized] ? normalized : DEFAULT_VALUES.tokenPreset;
        }
        if (INTEGER_FIELDS.has(fieldName)) {
            if (value === '' || value === null || value === undefined) {
                return '';
            }
            const parsed = Number(value);
            if (!Number.isFinite(parsed)) {
                return DEFAULT_VALUES[fieldName];
            }
            return Math.max(5, Math.min(180, Math.round(parsed)));
        }
        const normalized = String(value || '').trim();
        if (TOKEN_FIELDS.has(fieldName)) {
            return normalized;
        }
        return normalized || DEFAULT_VALUES[fieldName];
    }

    getTickerPreviewItemStyle(color) {
        const textColor = this.getReadableTextColor(color);
        const borderColor = this.withAlpha(color, 0.4);
        const backgroundColor = this.withAlpha(color, 0.22);
        return [
            `background-color: ${backgroundColor}`,
            `color: ${textColor}`,
            `border: 1px solid ${borderColor}`
        ].join('; ');
    }

    withAlpha(color, alpha) {
        const normalized = String(color || '').trim();
        const shortHexMatch = normalized.match(/^#([0-9a-fA-F]{3})$/);
        const longHexMatch = normalized.match(/^#([0-9a-fA-F]{6})$/);
        let hexValue = '';
        if (shortHexMatch) {
            hexValue = shortHexMatch[1].split('').map((char) => char + char).join('');
        } else if (longHexMatch) {
            hexValue = longHexMatch[1];
        }
        if (!hexValue) {
            return normalized || color;
        }
        const r = parseInt(hexValue.slice(0, 2), 16);
        const g = parseInt(hexValue.slice(2, 4), 16);
        const b = parseInt(hexValue.slice(4, 6), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    getReadableTextColor(color) {
        const normalized = String(color || '').trim();
        const shortHexMatch = normalized.match(/^#([0-9a-fA-F]{3})$/);
        const longHexMatch = normalized.match(/^#([0-9a-fA-F]{6})$/);
        let hexValue = '';
        if (shortHexMatch) {
            hexValue = shortHexMatch[1].split('').map((char) => char + char).join('');
        } else if (longHexMatch) {
            hexValue = longHexMatch[1];
        }
        if (!hexValue) {
            return '#ffffff';
        }
        const r = parseInt(hexValue.slice(0, 2), 16) / 255;
        const g = parseInt(hexValue.slice(2, 4), 16) / 255;
        const b = parseInt(hexValue.slice(4, 6), 16) / 255;
        const luminance = (0.2126 * r) + (0.7152 * g) + (0.0722 * b);
        return luminance > 0.6 ? '#080707' : '#ffffff';
    }

    dispatchFlowValueChangeEvent(variableName, value) {
        const valueChangeEvent = new CustomEvent('configuration_editor_input_value_changed', {
            bubbles: true,
            cancelable: false,
            composed: true,
            detail: {
                name: variableName,
                newValue: value,
                newValueDataType: INTEGER_FIELDS.has(variableName) ? 'Integer' : 'String'
            }
        });
        this.dispatchEvent(valueChangeEvent);
    }
}
