/**
 * Robokassa API Client
 * Клиент для работы с платежной системой Робокасса
 */

const crypto = require('crypto');

class RobokassaClient {
  constructor(merchantLogin, password1, password2, options = {}) {
    this.merchantLogin = merchantLogin;
    this.password1 = password1;
    this.password2 = password2;
    this.isTest = options.isTest || false;
    this.hashAlgorithm = options.hashAlgorithm || 'sha256';
    this.paymentUrl = 'https://auth.robokassa.ru/Merchant/Index.aspx';
  }

  _normalizeAmount(amount) {
    return Number(amount).toFixed(2);
  }

  generatePaymentSignature(outSum, invId, additionalParams = {}) {
    const normalizedSum = this._normalizeAmount(outSum);
    let signatureString = `${this.merchantLogin}:${normalizedSum}:${invId}:${this.password1}`;
    const sortedParams = Object.keys(additionalParams)
      .filter(key => key.startsWith('Shp_') || key.startsWith('shp_'))
      .sort()
      .map(key => `${key}=${additionalParams[key]}`);
    if (sortedParams.length > 0) {
      signatureString += `:${sortedParams.join(':')}`;
    }
    return this._hash(signatureString);
  }

  verifyResultSignature(outSum, invId, signatureValue, additionalParams = {}) {
    const normalizedSum = this._normalizeAmount(outSum);
    let checkString = `${normalizedSum}:${invId}:${this.password2}`;
    const sortedParams = Object.keys(additionalParams)
      .filter(key => key.startsWith('Shp_') || key.startsWith('shp_'))
      .sort()
      .map(key => `${key}=${additionalParams[key]}`);
    if (sortedParams.length > 0) {
      checkString += `:${sortedParams.join(':')}`;
    }
    const expectedSignature = this._hash(checkString);
    return signatureValue.toUpperCase() === expectedSignature.toUpperCase();
  }

  generatePaymentUrl(params) {
    const {
      outSum,
      invId,
      description,
      email,
      culture = 'ru',
      paymentMethod,
      additionalParams = {}
    } = params;

    const signature = this.generatePaymentSignature(outSum, invId, additionalParams);
    const urlParams = new URLSearchParams({
      MerchantLogin: this.merchantLogin,
      OutSum: this._normalizeAmount(outSum),
      InvId: invId.toString(),
      Description: description,
      SignatureValue: signature,
      Culture: culture,
    });

    if (email) {
      urlParams.append('Email', email);
    }
    if (this.isTest) {
      urlParams.append('IsTest', '1');
    }

    Object.entries(additionalParams).forEach(([key, value]) => {
      urlParams.append(key, value);
    });

    // СБП поддерживается только в боевом режиме (IsTest=0)
    // В тестовом режиме используем только карты
    if (paymentMethod === 'sbp' && !this.isTest) {
      urlParams.append('PaymentMethods', 'sbp');
    }

    return `${this.paymentUrl}?${urlParams.toString()}`;
  }

  parseCallback(callbackData) {
    const {
      OutSum,
      InvId,
      SignatureValue,
      Culture,
      ...customParams
    } = callbackData;

    const additionalParams = {};
    Object.keys(customParams).forEach(key => {
      if (key.startsWith('Shp_') || key.startsWith('shp_')) {
        additionalParams[key] = customParams[key];
      }
    });

    return {
      outSum: parseFloat(OutSum),
      invId: InvId,
      signatureValue: SignatureValue,
      culture: Culture,
      additionalParams,
      isValid: this.verifyResultSignature(
        OutSum,
        InvId,
        SignatureValue,
        additionalParams
      )
    };
  }

  _hash(str) {
    return crypto
      .createHash(this.hashAlgorithm)
      .update(str)
      .digest('hex')
      .toUpperCase();
  }

  generateResultResponse(invId) {
    return `OK${invId}`;
  }
}

module.exports = RobokassaClient;
