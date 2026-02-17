import { LightningElement, wire, api } from 'lwc';
import { gql, graphql } from 'lightning/uiGraphQLApi';

const DEFAULT_PRESET = 'default';
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
        tickerItemGap: '1.25rem',
        tickerPaddingY: '0.65rem',
        tickerShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
        tickerSpeedSeconds: 28
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
        tickerItemGap: '0.75rem',
        tickerPaddingY: '0.45rem',
        tickerShadow: '0 6px 18px rgba(0, 0, 0, 0.16)',
        tickerSpeedSeconds: 24
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
        tickerItemGap: '1.6rem',
        tickerPaddingY: '0.75rem',
        tickerShadow: '0 12px 36px rgba(0, 0, 0, 0.28)',
        tickerSpeedSeconds: 34
    }
});

export default class BannerBuddy extends LightningElement {
    banners = [];
    dismissedBanners = new Set();
    autoDismissTimer = null;
    _mode = 'sticky';

    // Experience Builder grouped config (takes precedence over individual props)
    @api bannerConfig;

    // Configurable color properties
    @api infoColor = '#6d5bf6';
    @api errorColor = '#c23934';
    @api warningColor = '#ff9e2c';
    @api successColor = '#08ca4a';
    @api tokenPreset = DEFAULT_PRESET;
    @api stickyTopOffset;
    @api stickyWidth;
    @api stickyMaxWidth;
    @api stickyBorderRadius;
    @api stickyShadow;
    @api tickerBackgroundColor;
    @api tickerTextColor;
    @api tickerEdgeFadeColor;
    @api tickerEdgeFadeWidth;
    @api tickerItemBackgroundColor;
    @api tickerSpeedSeconds;

    @api
    get mode() {
        return this._mode;
    }

    set mode(value) {
        this._mode = value;
        this.syncModeState();
    }

    /**
     * Resolves a config value from bannerConfig (Experience Builder CPE) or
     * falls back to the individual @api property value.
     */
    resolveConfig(fieldName, individualValue) {
        if (this.bannerConfig && typeof this.bannerConfig === 'object') {
            const configValue = this.bannerConfig[fieldName];
            if (configValue !== undefined && configValue !== null && configValue !== '') {
                return configValue;
            }
        }
        return individualValue;
    }

    get normalizedMode() {
        const resolved = this.resolveConfig('mode', this._mode);
        return String(resolved || 'sticky').toLowerCase() === 'ticker' ? 'ticker' : 'sticky';
    }

    get isTickerMode() {
        return this.normalizedMode === 'ticker';
    }

    get isStickyMode() {
        return this.normalizedMode === 'sticky';
    }

    get activeBanners() {
        const active = this.banners.filter(banner => banner.Status__c === 'Active');
        if (this.isTickerMode) {
            return active;
        }
        return active.filter(banner => !this.dismissedBanners.has(banner.Id));
    }

    get showBanner() {
        return this.activeBanners.length > 0;
    }

    get showStickyBanner() {
        return this.isStickyMode && this.showBanner;
    }

    get showTickerBanner() {
        return this.isTickerMode && this.showBanner;
    }

    get currentBanner() {
        return this.activeBanners[0] || {};
    }

    get currentBannerHasMessage() {
        return Boolean(this.currentBanner.Banner_Message__c);
    }

    get resolvedTokens() {
        const preset = TOKEN_PRESETS[this.normalizedTokenPreset];
        return {
            stickyTopOffset: this.normalizeLength(this.resolveConfig('stickyTopOffset', this.stickyTopOffset), preset.stickyTopOffset),
            stickyWidth: this.normalizeLength(this.resolveConfig('stickyWidth', this.stickyWidth), preset.stickyWidth),
            stickyMaxWidth: this.normalizeLength(this.resolveConfig('stickyMaxWidth', this.stickyMaxWidth), preset.stickyMaxWidth),
            stickyBorderRadius: this.normalizeLength(this.resolveConfig('stickyBorderRadius', this.stickyBorderRadius), preset.stickyBorderRadius),
            stickyShadow: this.normalizeString(this.resolveConfig('stickyShadow', this.stickyShadow), preset.stickyShadow),
            tickerBackgroundColor: this.normalizeString(this.resolveConfig('tickerBackgroundColor', this.tickerBackgroundColor), preset.tickerBackgroundColor),
            tickerTextColor: this.normalizeString(this.resolveConfig('tickerTextColor', this.tickerTextColor), preset.tickerTextColor),
            tickerEdgeFadeColor: this.normalizeString(this.resolveConfig('tickerEdgeFadeColor', this.tickerEdgeFadeColor), preset.tickerEdgeFadeColor),
            tickerEdgeFadeWidth: this.normalizeLength(this.resolveConfig('tickerEdgeFadeWidth', this.tickerEdgeFadeWidth), preset.tickerEdgeFadeWidth),
            tickerItemGap: preset.tickerItemGap,
            tickerPaddingY: preset.tickerPaddingY,
            tickerShadow: preset.tickerShadow,
            tickerSpeedSeconds: this.normalizePositiveNumber(this.resolveConfig('tickerSpeedSeconds', this.tickerSpeedSeconds), preset.tickerSpeedSeconds)
        };
    }

    get componentTokenStyle() {
        const tokens = this.resolvedTokens;
        return [
            `--bannerbuddy-sticky-width: ${tokens.stickyWidth}`,
            `--bannerbuddy-sticky-max-width: ${tokens.stickyMaxWidth}`,
            `--bannerbuddy-sticky-radius: ${tokens.stickyBorderRadius}`,
            `--bannerbuddy-sticky-shadow: ${tokens.stickyShadow}`,
            `--bannerbuddy-ticker-bg: ${tokens.tickerBackgroundColor}`,
            `--bannerbuddy-ticker-text: ${tokens.tickerTextColor}`,
            `--bannerbuddy-edge-overlay: ${tokens.tickerEdgeFadeColor}`,
            `--bannerbuddy-edge-fade-width: ${tokens.tickerEdgeFadeWidth}`,
            `--bannerbuddy-ticker-item-gap: ${tokens.tickerItemGap}`,
            `--bannerbuddy-ticker-padding-y: ${tokens.tickerPaddingY}`,
            `--bannerbuddy-ticker-shadow: ${tokens.tickerShadow}`,
            `--bannerbuddy-info-bg: ${this.resolvedInfoColor}`,
            `--bannerbuddy-info-text: ${this.getReadableTextColor(this.resolvedInfoColor)}`,
            `--bannerbuddy-error-bg: ${this.resolvedErrorColor}`,
            `--bannerbuddy-error-text: ${this.getReadableTextColor(this.resolvedErrorColor)}`,
            `--bannerbuddy-warning-bg: ${this.resolvedWarningColor}`,
            `--bannerbuddy-warning-text: ${this.getReadableTextColor(this.resolvedWarningColor)}`,
            `--bannerbuddy-success-bg: ${this.resolvedSuccessColor}`,
            `--bannerbuddy-success-text: ${this.getReadableTextColor(this.resolvedSuccessColor)}`
        ].join('; ');
    }

    get normalizedTokenPreset() {
        const resolved = this.resolveConfig('tokenPreset', this.tokenPreset);
        const preset = String(resolved || DEFAULT_PRESET).toLowerCase();
        return TOKEN_PRESETS[preset] ? preset : DEFAULT_PRESET;
    }

    get resolvedInfoColor() {
        return this.resolveConfig('infoColor', this.infoColor) || '#6d5bf6';
    }

    get resolvedErrorColor() {
        return this.resolveConfig('errorColor', this.errorColor) || '#c23934';
    }

    get resolvedWarningColor() {
        return this.resolveConfig('warningColor', this.warningColor) || '#ff9e2c';
    }

    get resolvedSuccessColor() {
        return this.resolveConfig('successColor', this.successColor) || '#08ca4a';
    }

    get variantColors() {
        return {
            Info: this.resolvedInfoColor,
            Error: this.resolvedErrorColor,
            Warning: this.resolvedWarningColor,
            Success: this.resolvedSuccessColor
        };
    }

    get tickerItems() {
        return this.activeBanners.map((banner, index) => ({
            ...banner,
            key: `${banner.Id}-primary-${index}`,
            duplicateKey: `${banner.Id}-duplicate-${index}`,
            variantClass: 'ticker-item',
            hasDescription: Boolean(banner.Banner_Description__c),
            hasLink: Boolean(banner.Links_To__c)
        }));
    }

    get tickerTrackStyle() {
        const baseSpeed = this.resolvedTokens.tickerSpeedSeconds;
        const durationSeconds = Math.max(baseSpeed, this.tickerItems.length * 6);
        return `--bannerbuddy-ticker-duration: ${durationSeconds}s;`;
    }

    get bannerClass() {
        const variant = this.currentBanner.Variant__c || 'Info';
        const variantMap = {
            'Info': 'slds-notify slds-notify_alert slds-alert_info',
            'Error': 'slds-notify slds-notify_alert slds-alert_error',
            'Warning': 'slds-notify slds-notify_alert slds-alert_warning',
            'Success': 'slds-notify slds-notify_alert slds-theme_success'
        };
        return variantMap[variant] || variantMap.Info;
    }

    get bannerStyle() {
        const variant = this.currentBanner.Variant__c || 'Info';
        const backgroundColor = this.variantColors[variant] || this.infoColor;
        const textColor = this.getReadableTextColor(backgroundColor);

        return `background-color: ${backgroundColor} !important; color: ${textColor} !important;`;
    }

    get iconName() {
        const variant = this.currentBanner.Variant__c || 'Info';
        const iconMap = {
            'Info': 'utility:info',
            'Error': 'utility:error',
            'Warning': 'utility:warning',
            'Success': 'utility:success'
        };
        return iconMap[variant] || iconMap.Info;
    }

    get showLink() {
        return this.currentBanner.Links_To__c ? true : false;
    }

    normalizeString(value, fallbackValue) {
        const normalized = String(value || '').trim();
        return normalized || fallbackValue;
    }

    normalizeLength(value, fallbackValue) {
        const normalized = String(value || '').trim();
        if (!normalized) {
            return fallbackValue;
        }
        if (/^-?\d+(\.\d+)?$/.test(normalized)) {
            return `${normalized}px`;
        }
        return normalized;
    }

    normalizePositiveNumber(value, fallbackValue) {
        const normalized = Number(value);
        return Number.isFinite(normalized) && normalized > 0 ? normalized : fallbackValue;
    }

    getReadableTextColor(color) {
        const normalized = String(color || '').trim();
        const shortHexMatch = normalized.match(/^#([0-9a-fA-F]{3})$/);
        const longHexMatch = normalized.match(/^#([0-9a-fA-F]{6})$/);
        let hexValue = '';
        if (shortHexMatch) {
            hexValue = shortHexMatch[1].split('').map(char => char + char).join('');
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

    @wire(graphql, {
        query: gql`
            query GetActiveBanners {
                uiapi {
                    query {
                        Banner_Buddy__c(
                            where: {
                                Status__c: { eq: "Active" }
                            }
                            orderBy: {
                                Start_Date__c: { order: DESC }
                            }
                        ) {
                            edges {
                                node {
                                    Id
                                    Name { value }
                                    Start_Date__c { value }
                                    End_Date__c { value }
                                    Status__c { value }
                                    Variant__c { value }
                                    Banner_Title__c { value }
                                    Banner_Description__c { value }
                                    Banner_Message__c { value }
                                    Links_To__c { value }
                                }
                            }
                        }
                    }
                }
            }
        `,
        variables: '$variables'
    })
    wiredBanners({ data, errors }) {
        if (data) {
            const edges = data.uiapi.query.Banner_Buddy__c.edges;
            this.banners = edges.map(edge => {
                const node = edge.node;
                return {
                    Id: node.Id,
                    Name: node.Name?.value,
                    Start_Date__c: node.Start_Date__c?.value,
                    End_Date__c: node.End_Date__c?.value,
                    Status__c: node.Status__c?.value,
                    Variant__c: node.Variant__c?.value,
                    Banner_Title__c: node.Banner_Title__c?.value,
                    Banner_Description__c: node.Banner_Description__c?.value,
                    Banner_Message__c: node.Banner_Message__c?.value,
                    Links_To__c: node.Links_To__c?.value
                };
            });

            this.syncModeState();
        } else if (errors) {
            console.error('Error fetching banners:', errors);
        }
    }

    get variables() {
        return {};
    }

    loadDismissedBanners() {
        const dismissed = sessionStorage.getItem('dismissedBanners');
        this.dismissedBanners = dismissed ? new Set(JSON.parse(dismissed)) : new Set();
    }

    clearAutoDismissTimer() {
        if (this.autoDismissTimer) {
            clearTimeout(this.autoDismissTimer);
            this.autoDismissTimer = null;
        }
    }

    syncModeState() {
        if (this.isTickerMode) {
            this.clearAutoDismissTimer();
            return;
        }

        this.loadDismissedBanners();
        this.setupAutoDismiss();
    }

    setupAutoDismiss() {
        if (!this.isStickyMode) {
            this.clearAutoDismissTimer();
            return;
        }

        this.clearAutoDismissTimer();

        if (this.showBanner) {
            // eslint-disable-next-line @lwc/lwc/no-async-operation
            this.autoDismissTimer = setTimeout(() => {
                this.handleAutoDismiss();
            }, 15000);
        }
    }

    handleAutoDismiss() {
        if (!this.isStickyMode) {
            return;
        }

        this.clearAutoDismissTimer();

        if (this.currentBanner.Id) {
            this.dismissedBanners.add(this.currentBanner.Id);
            this.banners = [...this.banners];
            this.setupAutoDismiss();
        }
    }

    handleDismiss() {
        if (!this.isStickyMode) {
            return;
        }

        this.clearAutoDismissTimer();

        if (this.currentBanner.Id) {
            this.dismissedBanners.add(this.currentBanner.Id);
            sessionStorage.setItem('dismissedBanners', JSON.stringify([...this.dismissedBanners]));
            this.banners = [...this.banners];
            this.setupAutoDismiss();
        }
    }

    disconnectedCallback() {
        this.clearAutoDismissTimer();
    }
}
