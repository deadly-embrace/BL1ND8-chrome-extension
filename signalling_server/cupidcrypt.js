"use strict";

const _0n = BigInt(0);
const _1n = BigInt(1);
const _2n = BigInt(2);
const u8a = (a) => a instanceof Uint8Array;

const hexes = Array.from({ length: 256 }, (v, i) => i.toString(16).padStart(2, '0'));

const bytesToHex = (bytes) => {
    if (!u8a(bytes))
        throw new Error('Uint8Array expected');
    let hex = '';
    for (let i = 0; i < bytes.length; i++) {
        hex += hexes[bytes[i]];
    }
    return hex;
}

const numberToHexUnpadded = (num) => {
    const hex = num.toString(16);
    return hex.length & 1 ? `0${hex}` : hex;
}

const hexToNumber = (hex) => {
    if (typeof hex !== 'string')
        throw new Error('hex string expected, got ' + typeof hex);
    return BigInt(hex === '' ? '0' : `0x${hex}`);
}

const hexToBytes = (hex) => {
    if (typeof hex !== 'string')
        throw new Error('hex string expected, got ' + typeof hex);
    if (hex.length % 2)
        throw new Error('hex string is invalid: unpadded ' + hex.length);
    const array = new Uint8Array(hex.length / 2);
    for (let i = 0; i < array.length; i++) {
        const j = i * 2;
        const hexByte = hex.slice(j, j + 2);
        const byte = Number.parseInt(hexByte, 16);
        if (Number.isNaN(byte) || byte < 0)
            throw new Error('invalid byte sequence');
        array[i] = byte;
    }
    return array;
}


const bytesToNumberBE = (bytes) => {
    return hexToNumber(bytesToHex(bytes));
}

const bytesToNumberLE = (bytes) => {
    if (!u8a(bytes))
        throw new Error('Uint8Array expected');
    return hexToNumber(bytesToHex(Uint8Array.from(bytes).reverse()));
}

const numberToBytesBE = (n, len) => hexToBytes(n.toString(16).padStart(len * 2, '0'));

const numberToBytesLE = (n, len) => numberToBytesBE(n, len).reverse();

const numberToVarBytesBE = (n) => hexToBytes(numberToHexUnpadded(n));

const ensureBytes = (title, hex, expectedLength) => {
    let res;
    if (typeof hex === 'string') {
        try {
            res = hexToBytes(hex);
        }
        catch (e) {
            throw new Error(`${title} must be valid hex string, got "${hex}". Cause: ${e}`);
        }
    }
    else if (u8a(hex)) {
        res = Uint8Array.from(hex);
    }
    else {
        throw new Error(`${title} must be hex string or Uint8Array`);
    }
    const len = res.length;
    if (typeof expectedLength === 'number' && len !== expectedLength)
        throw new Error(`${title} expected ${expectedLength} bytes, got ${len}`);
    return res;
}

const concatBytes = (...arrs) => {
    const r = new Uint8Array(arrs.reduce((sum, a) => sum + a.length, 0));
    let pad = 0; 
    arrs.forEach((a) => {
        if (!u8a(a))
            throw new Error('Uint8Array expected');
        r.set(a, pad);
        pad += a.length;
    });
    return r;
}

const equalBytes = (b1, b2) => {
  
    if (b1.length !== b2.length)
        return false;
    for (let i = 0; i < b1.length; i++)
        if (b1[i] !== b2[i])
            return false;
    return true;
}

const utf8ToBytes = (str) => {
    if (typeof str !== 'string') {
        throw new Error(`utf8ToBytes expected string, got ${typeof str}`);
    }
    return new TextEncoder().encode(str);
}

const bitLen = (n) => {
    let len;
    for (len = 0; n > 0n; n >>= _1n, len += 1)
        ;
    return len;
}

const bitGet = (n, pos) => (nBigInt(pos)) & 1n;

const bitSet = (n, pos, value) => n | ((value ? _1n : _0n) << BigInt(pos));

const bitMask = (n) => (_2n << BigInt(n - 1)) - _1n;

const u8n = (data) => new Uint8Array(data); // creates Uint8Array
const u8fr = (arr) => Uint8Array.from(arr); // another shortcut

const createHmacDrbg = (hashLen, qByteLen, hmacFn) => {
    if (typeof hashLen !== 'number' || hashLen < 2)
        throw new Error('hashLen must be a number');
    if (typeof qByteLen !== 'number' || qByteLen < 2)
        throw new Error('qByteLen must be a number');
    if (typeof hmacFn !== 'function')
        throw new Error('hmacFn must be a function');

    let v = u8n(hashLen); 
    let k = u8n(hashLen); 
    let i = 0; 
    const reset = () => {
        v.fill(1);
        k.fill(0);
        i = 0;
    };

    const h = (...b) => hmacFn(k, v, ...b); 
    const reseed = (seed = u8n()) => {
        
        k = h(u8fr([0x00]), seed); // k = hmac(k || v || 0x00 || seed)
        v = h(); // v = hmac(k || v)
        if (seed.length === 0)
            return;
        k = h(u8fr([0x01]), seed); // k = hmac(k || v || 0x01 || seed)
        v = h(); // v = hmac(k || v)
    };

    const gen = () => {
        
        if (i++ >= 1000)
            throw new Error('drbg: tried 1000 values');
        let len = 0;
        const out = [];
        while (len < qByteLen) {
            v = h();
            const sl = v.slice();
            out.push(sl);
            len += v.length;
        }
        return concatBytes(...out);
    };

    const genUntil = (seed, pred) => {
        reset();
        reseed(seed); // Steps D-G
        let res = undefined; // Step H: grind until k is in [1..n-1]
        while (!(res = pred(gen())))
            reseed();
        reset();
        return res;
    };
    return genUntil;
}

const validatorFns = {
    bigint: (val) => typeof val === 'bigint',
    function: (val) => typeof val === 'function',
    boolean: (val) => typeof val === 'boolean',
    string: (val) => typeof val === 'string',
    isSafeInteger: (val) => Number.isSafeInteger(val),
    array: (val) => Array.isArray(val),
    field: (val, object) => object.Fp.isValid(val),
    hash: (val) => typeof val === 'function' && Number.isSafeInteger(val.outputLen),
};

const validateObject = (object, validators, optValidators = {}) => {
    const checkField = (fieldName, type, isOptional) => {
        const checkVal = validatorFns[type];
        if (typeof checkVal !== 'function')
            throw new Error(`Invalid validator "${type}", expected function`);
        const val = object[fieldName];
        if (isOptional && val === undefined)
            return;
    };
    for (const [fieldName, type] of Object.entries(validators))
        checkField(fieldName, type, false);
    for (const [fieldName, type] of Object.entries(optValidators))
        checkField(fieldName, type, true);
    return object;
}

const _3n = BigInt(3), _4n = BigInt(4), _5n = BigInt(5), _8n = BigInt(8);
const _9n = BigInt(9), _16n = BigInt(16);

const mod = (a, b) => {
    const result = a % b;
    return result >= _0n ? result : b + result;
}

const pow = (num, power, modulo) => {
    if (modulo <= _0n || power < _0n)
        throw new Error('Expected power/modulo > 0');
    if (modulo === _1n)
        return _0n;
    let res = _1n;
    while (power > _0n) {
        if (power & _1n)
            res = (res * num) % modulo;
        num = (num * num) % modulo;
        power >>= _1n;
    }
    return res;
}

const pow2 = (x, power, modulo) => {
    let res = x;
    while (power-- > _0n) {
        res *= res;
        res %= modulo;
    }
    return res;
}

const invert = (number, modulo) => {
    if (number === _0n || modulo <= _0n) {
        throw new Error(`invert: expected positive integers, got n=${number} mod=${modulo}`);
    }
    // GCD
    let a = mod(number, modulo);
    let b = modulo;
    let x = _0n, y = _1n, u = _1n, v = _0n;

    while (a !== _0n) {
        const q = b / a;
        const r = b % a;
        const m = x - u * q;
        const n = y - v * q;

        b = a, a = r, x = u, y = v, u = m, v = n;
    }

    const gcd = b;

    if (gcd !== _1n)
        throw new Error('invert: does not exist');

    return mod(x, modulo);
}

const tonelliShanks = (P) => {

    const legendreC = (P - _1n) / _2n;
    let Q, S, Z;
 
    for (Q = P - _1n, S = 0; Q % _2n === _0n; Q /= _2n, S++)
        ;

    for (Z = _2n; Z < P && pow(Z, legendreC, P) !== P - _1n; Z++)
        ;

    if (S === 1) {
        const p1div4 = (P + _1n) / _4n;
        return function tonelliFast(Fp, n) {
            const root = Fp.pow(n, p1div4);
            if (!Fp.eql(Fp.sqr(root), n))
                throw new Error('Cannot find square root');
            return root;
        };
    }

    const Q1div2 = (Q + _1n) / _2n;

    return function tonelliSlow(Fp, n) {

        if (Fp.pow(n, legendreC) === Fp.neg(Fp.ONE))
            throw new Error('Cannot find square root');
        let r = S;

        let g = Fp.pow(Fp.mul(Fp.ONE, Z), Q); 
        let x = Fp.pow(n, Q1div2); 
        let b = Fp.pow(n, Q); 
        while (!Fp.eql(b, Fp.ONE)) {
            if (Fp.eql(b, Fp.ZERO))
                return Fp.ZERO; 

            let m = 1;
            for (let t2 = Fp.sqr(b); m < r; m++) {
                if (Fp.eql(t2, Fp.ONE))
                    break;
                t2 = Fp.sqr(t2); // t2 *= t2
            }

            const ge = Fp.pow(g, _1n << BigInt(r - m - 1)); // ge = 2^(r-m-1)
            g = Fp.sqr(ge); // g = ge * ge
            x = Fp.mul(x, ge); // x *= ge
            b = Fp.mul(b, g); // b *= g
            r = m;
        }
        return x;
    };
}

const FpSqrt = (P) => {

    if (P % _4n === _3n) {

        const p1div4 = (P + _1n) / _4n;
        return function sqrt3mod4(Fp, n) {
            const root = Fp.pow(n, p1div4);
            // Throw if root**2 != n
            if (!Fp.eql(Fp.sqr(root), n))
                throw new Error('Cannot find square root');
            return root;
        };
    }

    if (P % _8n === _5n) {
        const c1 = (P - _5n) / _8n;
        return function sqrt5mod8(Fp, n) {
            const n2 = Fp.mul(n, _2n);
            const v = Fp.pow(n2, c1);
            const nv = Fp.mul(n, v);
            const i = Fp.mul(Fp.mul(nv, _2n), v);
            const root = Fp.mul(nv, Fp.sub(i, Fp.ONE));
            if (!Fp.eql(Fp.sqr(root), n))
                throw new Error('Cannot find square root');
            return root;
        };
    }

    return tonelliShanks(P);
}

const isNegativeLE = (num, modulo) => (mod(num, modulo) & _1n) === _1n;

const FIELD_FIELDS = [
    'create', 'isValid', 'is0', 'neg', 'inv', 'sqrt', 'sqr',
    'eql', 'add', 'sub', 'mul', 'pow', 'div',
    'addN', 'subN', 'mulN', 'sqrN'
];

const validateField = (field) => {
    const initial = {
        ORDER: 'bigint',
        MASK: 'bigint',
        BYTES: 'isSafeInteger',
        BITS: 'isSafeInteger',
    };
    const opts = FIELD_FIELDS.reduce((map, val) => {
        map[val] = 'function';
        return map;
    }, initial);
    return validateObject(field, opts);
}

const FpPow = (f, num, power) => {
    if (power < _0n)
        throw new Error('Expected power > 0');
    if (power === _0n)
        return f.ONE;
    if (power === _1n)
        return num;
    let p = f.ONE;
    let d = num;
    while (power > _0n) {
        if (power & _1n)
            p = f.mul(p, d);
        d = f.sqr(d);
        power >>= 1n;
    }
    return p;
}

const FpInvertBatch = (f, nums) => {
    const tmp = new Array(nums.length);

    const lastMultiplied = nums.reduce((acc, num, i) => {
        if (f.is0(num))
            return acc;
        tmp[i] = acc;
        return f.mul(acc, num);
    }, f.ONE);

    const inverted = f.inv(lastMultiplied);

    nums.reduceRight((acc, num, i) => {
        if (f.is0(num))
            return acc;
        tmp[i] = f.mul(acc, tmp[i]);
        return f.mul(acc, num);
    }, inverted);
    return tmp;
}

const FpDiv = (f, lhs, rhs) => {
    return f.mul(lhs, typeof rhs === 'bigint' ? invert(rhs, f.ORDER) : f.inv(rhs));
}

const FpIsSquare = (f) => {
    const legendreConst = (f.ORDER - _1n) / _2n; // Integer arithmetic
    return (x) => {
        const p = f.pow(x, legendreConst);
        return f.eql(p, f.ZERO) || f.eql(p, f.ONE);
    };
}

const nLength = (n, nBitLength) => {
    const _nBitLength = nBitLength !== undefined ? nBitLength : n.toString(2).length;
    const nByteLength = Math.ceil(_nBitLength / 8);
    return { nBitLength: _nBitLength, nByteLength };
}

const Fp = (ORDER, bitLen, isLE = false, redef = {}) => {
    if (ORDER <= _0n)
        throw new Error(`Expected Fp ORDER > 0, got ${ORDER}`);
    const { nBitLength: BITS, nByteLength: BYTES } = nLength(ORDER, bitLen);
    if (BYTES > 2048)
        throw new Error('Field lengths over 2048 bytes are not supported');
    const sqrtP = FpSqrt(ORDER);
    const f = Object.freeze({
        ORDER,
        BITS,
        BYTES,
        MASK: bitMask(BITS),
        ZERO: _0n,
        ONE: _1n,
        create: (num) => mod(num, ORDER),
        isValid: (num) => {
            if (typeof num !== 'bigint')
                throw new Error(`Invalid field element: expected bigint, got ${typeof num}`);
            return _0n <= num && num < ORDER; // 0 is valid element, but it's not invertible
        },
        is0: (num) => num === _0n,
        isOdd: (num) => (num & _1n) === _1n,
        neg: (num) => mod(-num, ORDER),
        eql: (lhs, rhs) => lhs === rhs,
        sqr: (num) => mod(num * num, ORDER),
        add: (lhs, rhs) => mod(lhs + rhs, ORDER),
        sub: (lhs, rhs) => mod(lhs - rhs, ORDER),
        mul: (lhs, rhs) => mod(lhs * rhs, ORDER),
        pow: (num, power) => FpPow(f, num, power),
        div: (lhs, rhs) => mod(lhs * invert(rhs, ORDER), ORDER),
        // Same as above, but doesn't normalize
        sqrN: (num) => num * num,
        addN: (lhs, rhs) => lhs + rhs,
        subN: (lhs, rhs) => lhs - rhs,
        mulN: (lhs, rhs) => lhs * rhs,
        inv: (num) => invert(num, ORDER),
        sqrt: redef.sqrt || ((n) => sqrtP(f, n)),
        invertBatch: (lst) => FpInvertBatch(f, lst),
        // TODO: do we really need constant cmov?
        // We don't have const-time bigints anyway, so probably will be not very useful
        cmov: (a, b, c) => (c ? b : a),
        toBytes: (num) => (isLE ? numberToBytesLE(num, BYTES) : numberToBytesBE(num, BYTES)),
        fromBytes: (bytes) => {
            if (bytes.length !== BYTES)
                throw new Error(`Fp.fromBytes: expected ${BYTES}, got ${bytes.length}`);
            return isLE ? bytesToNumberLE(bytes) : bytesToNumberBE(bytes);
        },
    });
    return Object.freeze(f);
}

const FpSqrtOdd = (Fp, elm) => {
    if (!Fp.isOdd)
        throw new Error(`Field doesn't have isOdd`);
    const root = Fp.sqrt(elm);
    return Fp.isOdd(root) ? root : Fp.neg(root);
}

const FpSqrtEven = (Fp, elm) => {
    if (!Fp.isOdd)
        throw new Error(`Field doesn't have isOdd`);
    const root = Fp.sqrt(elm);
    return Fp.isOdd(root) ? Fp.neg(root) : root;
}

const hashToPrivateScalar = (hash, groupOrder, isLE = false) => {
    hash = ensureBytes('privateHash', hash);
    const hashLen = hash.length;
    const minLen = nLength(groupOrder).nByteLength + 8;
    if (minLen < 24 || hashLen < minLen || hashLen > 1024)
        throw new Error(`hashToPrivateScalar: expected ${minLen}-1024 bytes of input, got ${hashLen}`);
    const num = isLE ? bytesToNumberLE(hash) : bytesToNumberBE(hash);
    return mod(num, groupOrder - _1n) + _1n;
}

const validateOpts = (curve) => {
    validateObject(curve, {
        a: 'bigint',
    }, {
        montgomeryBits: 'isSafeInteger',
        nByteLength: 'isSafeInteger',
        adjustScalarBytes: 'function',
        domain: 'function',
        powPminus2: 'function',
        Gu: 'bigint',
    });
    // Set defaults
    return Object.freeze({ ...curve });
}

const montgomery = (curveDef) => {
    const CURVE = validateOpts(curveDef);
    const { P } = CURVE;
    const modP = (n) => mod(n, P);
    const montgomeryBits = CURVE.montgomeryBits;
    const montgomeryBytes = Math.ceil(montgomeryBits / 8);
    const fieldLen = CURVE.nByteLength;
    const adjustScalarBytes = CURVE.adjustScalarBytes || ((bytes) => bytes);
    const powPminus2 = CURVE.powPminus2 || ((x) => pow(x, P - BigInt(2), P));

    const cswap = (swap, x_2, x_3) => {
        const dummy = modP(swap * (x_2 - x_3));
        x_2 = modP(x_2 - dummy);
        x_3 = modP(x_3 + dummy);
        return [x_2, x_3];
    }

    const assertFieldElement = (n) => {
        if (typeof n === 'bigint' && _0n <= n && n < P)
            return n;
        throw new Error('Expected valid scalar 0 < scalar < CURVE.P');
    }

    const a24 = (CURVE.a - BigInt(2)) / BigInt(4);
    
    const montgomeryLadder = (pointU, scalar) => {
        const u = assertFieldElement(pointU);
 
        const k = assertFieldElement(scalar);
        const x_1 = u;
        let x_2 = _1n;
        let z_2 = _0n;
        let x_3 = u;
        let z_3 = _1n;
        let swap = _0n;
        let sw;

        for (let t = BigInt(montgomeryBits - 1); t >= _0n; t--) {
            const k_t = (k >> t) & _1n;
            swap ^= k_t;
            sw = cswap(swap, x_2, x_3);
            x_2 = sw[0];
            x_3 = sw[1];
            sw = cswap(swap, z_2, z_3);
            z_2 = sw[0];
            z_3 = sw[1];
            swap = k_t;
            const A = x_2 + z_2;
            const AA = modP(A * A);
            const B = x_2 - z_2;
            const BB = modP(B * B);
            const E = AA - BB;
            const C = x_3 + z_3;
            const D = x_3 - z_3;
            const DA = modP(D * A);
            const CB = modP(C * B);
            const dacb = DA + CB;
            const da_cb = DA - CB;
            x_3 = modP(dacb * dacb);
            z_3 = modP(x_1 * modP(da_cb * da_cb));
            x_2 = modP(AA * BB);
            z_2 = modP(E * (AA + modP(a24 * E)));
        }
        // (x_2, x_3) = cswap(swap, x_2, x_3)
        sw = cswap(swap, x_2, x_3);
        x_2 = sw[0];
        x_3 = sw[1];
        // (z_2, z_3) = cswap(swap, z_2, z_3)
        sw = cswap(swap, z_2, z_3);
        z_2 = sw[0];
        z_3 = sw[1];
        // z_2^(p - 2)
        const z2 = powPminus2(z_2);
        // Return x_2 * (z_2^(p - 2))
        return modP(x_2 * z2);
    }

    const encodeUCoordinate = (u) => {
        return numberToBytesLE(modP(u), montgomeryBytes);
    }

    const decodeUCoordinate = (uEnc) => {

        const u = ensureBytes('u coordinate', uEnc, montgomeryBytes);

        if (fieldLen === montgomeryBytes)
            u[fieldLen - 1] &= 127; // 0b0111_1111
        return bytesToNumberLE(u);
    }

    const decodeScalar = (n) => {
        const bytes = ensureBytes('scalar', n);
        if (bytes.length !== montgomeryBytes && bytes.length !== fieldLen)
            throw new Error(`Expected ${montgomeryBytes} or ${fieldLen} bytes, got ${bytes.length}`);
        return bytesToNumberLE(adjustScalarBytes(bytes));
    }

    const scalarMult = (scalar, u) => {
        const pointU = decodeUCoordinate(u);
        const _scalar = decodeScalar(scalar);
        const pu = montgomeryLadder(pointU, _scalar);
 
        if (pu === _0n)
            throw new Error('Invalid private or public key received');
        return encodeUCoordinate(pu);
    }

    // Computes public key from private.
    const GuBytes = encodeUCoordinate(CURVE.Gu);

    const scalarMultBase = (scalar) => {
        return scalarMult(scalar, GuBytes);
    }

    return {
        scalarMult,
        scalarMultBase,
        getSharedSecret: (privateKey, publicKey) => scalarMult(privateKey, publicKey),
        getPublicKey: (privateKey) => scalarMultBase(privateKey),
        GuBytes: GuBytes,
    };
}

const ed448P = BigInt('726838724295606890549323807888004534353641360687318060281490199180612328166730772686396383698676545930088884461843637361053498018365439');

const adjustScalarBytes = (bytes) => {

    bytes[0] &= 252; // 0b11111100
    bytes[55] |= 128; // 0b10000000
    bytes[56] = 0;
    return bytes;
}

const ed448_pow_Pminus3div4 = (x) => {
    const P = ed448P;
    const _1n = BigInt(1), _2n = BigInt(2), _3n = BigInt(3), _11n = BigInt(11);
    const _22n = BigInt(22), _44n = BigInt(44), _88n = BigInt(88), _223n = BigInt(223);
    const b2 = (x * x * x) % P;
    const b3 = (b2 * b2 * x) % P;
    const b6 = (pow2(b3, _3n, P) * b3) % P;
    const b9 = (pow2(b6, _3n, P) * b3) % P;
    const b11 = (pow2(b9, _2n, P) * b2) % P;
    const b22 = (pow2(b11, _11n, P) * b11) % P;
    const b44 = (pow2(b22, _22n, P) * b22) % P;
    const b88 = (pow2(b44, _44n, P) * b44) % P;
    const b176 = (pow2(b88, _88n, P) * b88) % P;
    const b220 = (pow2(b176, _44n, P) * b44) % P;
    const b222 = (pow2(b220, _2n, P) * b2) % P;
    const b223 = (pow2(b222, _1n, P) * x) % P;
    return (pow2(b223, _223n, P) * b222) % P;
}

const ecdh = montgomery({
    a: BigInt(156326),
    montgomeryBits: 448,
    nByteLength: 57,
    P: ed448P,
    Gu: BigInt(5),
    powPminus2: (x) => {
        const P = ed448P;
        const Pminus3div4 = ed448_pow_Pminus3div4(x);
        const Pminus3 = pow2(Pminus3div4, BigInt(2), P);
        return mod(Pminus3 * x, P); // Pminus3 * x = Pminus2
    },
    adjustScalarBytes,
});

const randomPrivate = () => {
    const hexChars = '0123456789abcdef';
    let priv = '';
    for(let i = 0; i < 112; i++) priv += hexChars[(Math.random() * 1024 | 0) & 15];
    return priv;
}

const pubFromPriv = (priv) => Buffer.from(ecdh.getPublicKey(priv)).toString('hex');

const sharedSecret = (priv, pub) => Buffer.from(ecdh.getSharedSecret(priv, pub));

const chachaSetup = (okey, n, k, top) => {

    let x0 = 0x61707865;
	let x1 = 0x3320646e;
	let x2 = 0x79622d32;
	let x3 = 0x6b206574;
    let x4 = k[0];
    let x5 = k[1];
    let x6 = k[2];
    let x7 = k[3];
    let x8 = k[4];
    let x9 = k[5];
    let x10 = k[6];
    let x11 = k[7];
    let x12 = n[0];
    let x13 = n[1];
    let x14 = n[2];
    let x15 = n[3];

    for(let i = 0; i < 10; i++) {
        x0 = x0 + x4 | 0; v = x12 ^ x0;
        x12 = (v << 16) | (v >>> 16);
        x8 = x8 + x12 | 0; v = x4 ^ x8;
        x4 = (v << 12) | (v >>> 20);
        x0 = x0 + x4 | 0; v = x12 ^ x0;
        x12 = (v << 8) | (v >>> 24);
        x8 = x8 + x12 | 0; v = x4 ^ x8;
        x4 = (v << 7) | (v >>> 25);
    

        x1 = x1 + x5 | 0; v = x13 ^ x1;
        x13 = (v << 16) | (v >>> 16);
        x9 = x9 + x13 | 0; v = x5 ^ x9;
        x5 = (v << 12) | (v >>> 20);
        x1 = x1 + x5 | 0; v = x13 ^ x1;
        x13 = (v << 8) | (v >>> 24);
        x9 = x9 + x13 | 0; v = x5 ^ x9;
        x5 = (v << 7) | (v >>> 25);
    

        x2 = x2 + x6 | 0; v = x14 ^ x2;
        x14 = (v << 16) | (v >>> 16);
        x10 = x10 + x14 | 0; v = x6 ^ x10;
        x6 = (v << 12) | (v >>> 20);
        x2 = x2 + x6 | 0; v = x14 ^ x2;
        x14 = (v << 8) | (v >>> 24);
        x10 = x10 + x14 | 0; v = x6 ^ x10;
        x6 = (v << 7) | (v >>> 25);
    

        x3 = x3 + x7 | 0; v = x15 ^ x3;
        x15 = (v << 16) | (v >>> 16);
        x11 = x11 + x15 | 0; v = x7 ^ x11;
        x7 = (v << 12) | (v >>> 20);
        x3 = x3 + x7 | 0; v = x15 ^ x3;
        x15 = (v << 8) | (v >>> 24);
        x11 = x11 + x15 | 0; v = x7 ^ x11;
        x7 = (v << 7) | (v >>> 25);
    

        x0 = x0 + x5 | 0; v = x15 ^ x0;
        x15 = (v << 16) | (v >>> 16);
        x10 = x10 + x15 | 0; v = x5 ^ x10;
        x5 = (v << 12) | (v >>> 20);
        x0 = x0 + x5 | 0; v = x15 ^ x0;
        x15 = (v << 8) | (v >>> 24);
        x10 = x10 + x15 | 0; v = x5 ^ x10;
        x5 = (v << 7) | (v >>> 25);
    

        x1 = x1 + x6 | 0; v = x12 ^ x1;
        x12 = (v << 16) | (v >>> 16);
        x11 = x11 + x12 | 0; v = x6 ^ x11;
        x6 = (v << 12) | (v >>> 20);
        x1 = x1 + x6 | 0; v = x12 ^ x1;
        x12 = (v << 8) | (v >>> 24);
        x11 = x11 + x12 | 0; v = x6 ^ x11;
        x6 = (v << 7) | (v >>> 25);
    

        x2 = x2 + x7 | 0; v = x13 ^ x2;
        x13 = (v << 16) | (v >>> 16);
        x8 = x8 + x13 | 0; v = x7 ^ x8;
        x7 = (v << 12) | (v >>> 20);
        x2 = x2 + x7 | 0; v = x13 ^ x2;
        x13 = (v << 8) | (v >>> 24);
        x8 = x8 + x13 | 0; v = x7 ^ x8;
        x7 = (v << 7) | (v >>> 25);
    

        x3 = x3 + x4 | 0; v = x14 ^ x3;
        x14 = (v << 16) | (v >>> 16);
        x9 = x9 + x14 | 0; v = x4 ^ x9;
        x4 = (v << 12) | (v >>> 20);
        x3 = x3 + x4 | 0; v = x14 ^ x3;
        x14 = (v << 8) | (v >>> 24);
        x9 = x9 + x14 | 0; v = x4 ^ x9;
        x4 = (v << 7) | (v >>> 25);
    }

    okey[0] = 0x61707865;
	okey[1] = 0x3320646e;
	okey[2] = 0x79622d32;
	okey[3] = 0x6b206574;
    okey[4] = x0;
    okey[5] = x1;
    okey[6] = x2;
    okey[7] = x3;
    okey[8] = x12;
    okey[9] = x13;
    okey[10] = x14;
    okey[11] = x15;
    okey[12] = top;
    okey[13] = 1 ^ top;
    okey[14] = n[4];
    okey[15] = n[5];
 }

 const chachaFill = (key, buff, blocks) => {
    let i = 0;
    blocks <<= 6;
    while(i < blocks) {

    let x0 = key[0];
    let x1 = key[1];
    let x2 = key[2];
    let x3 = key[3];
    let x4 = key[4];
    let x5 = key[5];
    let x6 = key[6];
    let x7 = key[7];
    let x8 = key[8];
    let x9 = key[9];
    let x10 = key[10];
    let x11 = key[11];
    let x12 = key[12];
    let x13 = key[13];
    let x14 = key[14];
    let x15 = key[15];

    for(let i = 0; i < 10; i++) {
        x0 = x0 + x4 | 0; v = x12 ^ x0;
        x12 = (v << 16) | (v >>> 16);
        x8 = x8 + x12 | 0; v = x4 ^ x8;
        x4 = (v << 12) | (v >>> 20);
        x0 = x0 + x4 | 0; v = x12 ^ x0;
        x12 = (v << 8) | (v >>> 24);
        x8 = x8 + x12 | 0; v = x4 ^ x8;
        x4 = (v << 7) | (v >>> 25);
    

        x1 = x1 + x5 | 0; v = x13 ^ x1;
        x13 = (v << 16) | (v >>> 16);
        x9 = x9 + x13 | 0; v = x5 ^ x9;
        x5 = (v << 12) | (v >>> 20);
        x1 = x1 + x5 | 0; v = x13 ^ x1;
        x13 = (v << 8) | (v >>> 24);
        x9 = x9 + x13 | 0; v = x5 ^ x9;
        x5 = (v << 7) | (v >>> 25);
    

        x2 = x2 + x6 | 0; v = x14 ^ x2;
        x14 = (v << 16) | (v >>> 16);
        x10 = x10 + x14 | 0; v = x6 ^ x10;
        x6 = (v << 12) | (v >>> 20);
        x2 = x2 + x6 | 0; v = x14 ^ x2;
        x14 = (v << 8) | (v >>> 24);
        x10 = x10 + x14 | 0; v = x6 ^ x10;
        x6 = (v << 7) | (v >>> 25);
    

        x3 = x3 + x7 | 0; v = x15 ^ x3;
        x15 = (v << 16) | (v >>> 16);
        x11 = x11 + x15 | 0; v = x7 ^ x11;
        x7 = (v << 12) | (v >>> 20);
        x3 = x3 + x7 | 0; v = x15 ^ x3;
        x15 = (v << 8) | (v >>> 24);
        x11 = x11 + x15 | 0; v = x7 ^ x11;
        x7 = (v << 7) | (v >>> 25);
    

        x0 = x0 + x5 | 0; v = x15 ^ x0;
        x15 = (v << 16) | (v >>> 16);
        x10 = x10 + x15 | 0; v = x5 ^ x10;
        x5 = (v << 12) | (v >>> 20);
        x0 = x0 + x5 | 0; v = x15 ^ x0;
        x15 = (v << 8) | (v >>> 24);
        x10 = x10 + x15 | 0; v = x5 ^ x10;
        x5 = (v << 7) | (v >>> 25);
    

        x1 = x1 + x6 | 0; v = x12 ^ x1;
        x12 = (v << 16) | (v >>> 16);
        x11 = x11 + x12 | 0; v = x6 ^ x11;
        x6 = (v << 12) | (v >>> 20);
        x1 = x1 + x6 | 0; v = x12 ^ x1;
        x12 = (v << 8) | (v >>> 24);
        x11 = x11 + x12 | 0; v = x6 ^ x11;
        x6 = (v << 7) | (v >>> 25);
    

        x2 = x2 + x7 | 0; v = x13 ^ x2;
        x13 = (v << 16) | (v >>> 16);
        x8 = x8 + x13 | 0; v = x7 ^ x8;
        x7 = (v << 12) | (v >>> 20);
        x2 = x2 + x7 | 0; v = x13 ^ x2;
        x13 = (v << 8) | (v >>> 24);
        x8 = x8 + x13 | 0; v = x7 ^ x8;
        x7 = (v << 7) | (v >>> 25);
    

        x3 = x3 + x4 | 0; v = x14 ^ x3;
        x14 = (v << 16) | (v >>> 16);
        x9 = x9 + x14 | 0; v = x4 ^ x9;
        x4 = (v << 12) | (v >>> 20);
        x3 = x3 + x4 | 0; v = x14 ^ x3;
        x14 = (v << 8) | (v >>> 24);
        x9 = x9 + x14 | 0; v = x4 ^ x9;
        x4 = (v << 7) | (v >>> 25);
    }

    x0 = x0 + key[0] | 0;
    x1 = x1 + key[1] | 0;
    x2 = x2 + key[2] | 0;
    x3 = x3 + key[3] | 0;
    x4 = x4 + key[4] | 0;
    x5 = x5 + key[5] | 0;
    x6 = x6 + key[6] | 0;
    x7 = x7 + key[7] | 0;
    x8 = x8 + key[8] | 0;
    x9 = x9 + key[9] | 0;
    x10 = x10 + key[10] | 0;
    x11 = x11 + key[11] | 0;
    x12 = x12 + key[12] | 0;
    x13 = x13 + key[13] | 0;
    x14 = x14 + key[14] | 0;
    x15 = x15 + key[15] | 0;

    if(key[12]) key[12] = key[12] + 1;
        else key[13] = key[13] + 1; 

    buff[i++] = x0 & 255; x0 >>>= 8;
    buff[i++] = x0 & 255; x0 >>>= 8;
    buff[i++] = x0 & 255; x0 >>>= 8;
    buff[i++] = x0;
              
    buff[i++] = x1 & 255; x1 >>>= 8;
    buff[i++] = x1 & 255; x1 >>>= 8;
    buff[i++] = x1 & 255; x1 >>>= 8;
    buff[i++] = x1;       
        
    buff[i++] = x2 & 255; x2 >>>= 8;
    buff[i++] = x2 & 255; x2 >>>= 8;
    buff[i++] = x2 & 255; x2 >>>= 8;
    buff[i++] = x2; 
        
    buff[i++] = x3 & 255; x3 >>>= 8;
    buff[i++] = x3 & 255; x3 >>>= 8;
    buff[i++] = x3 & 255; x3 >>>= 8;
    buff[i++] = x3;
         
    buff[i++] = x4 & 255; x4 >>>= 8;
    buff[i++] = x4 & 255; x4 >>>= 8;
    buff[i++] = x4 & 255; x4 >>>= 8;
    buff[i++] = x4;
         
    buff[i++] = x5 & 255; x5 >>>= 8;
    buff[i++] = x5 & 255; x5 >>>= 8;
    buff[i++] = x5 & 255; x5 >>>= 8;
    buff[i++] = x5;
         
    buff[i++] = x6 & 255; x6 >>>= 8;
    buff[i++] = x6 & 255; x6 >>>= 8;
    buff[i++] = x6 & 255; x6 >>>= 8;
    buff[i++] = x6;
         
    buff[i++] = x7 & 255; x7 >>>= 8;
    buff[i++] = x7 & 255; x7 >>>= 8;
    buff[i++] = x7 & 255; x7 >>>= 8;
    buff[i++] = x7;
         
    buff[i++] = x8 & 255; x8 >>>= 8;
    buff[i++] = x8 & 255; x8 >>>= 8;
    buff[i++] = x8 & 255; x8 >>>= 8;
    buff[i++] = x8;
         
    buff[i++] = x9 & 255; x9 >>>= 8;
    buff[i++] = x9 & 255; x9 >>>= 8;
    buff[i++] = x9 & 255; x9 >>>= 8;
    buff[i++] = x9;
         
    buff[i++] = x10 & 255; x10 >>>= 8;
    buff[i++] = x10 & 255; x10 >>>= 8;
    buff[i++] = x10 & 255; x10 >>>= 8;
    buff[i++] = x10;
         
    buff[i++] = x11 & 255; x11 >>>= 8;
    buff[i++] = x11 & 255; x11 >>>= 8;
    buff[i++] = x11 & 255; x11 >>>= 8;
    buff[i++] = x11;
         
    buff[i++] = x12 & 255; x12 >>>= 8;
    buff[i++] = x12 & 255; x12 >>>= 8;
    buff[i++] = x12 & 255; x12 >>>= 8;
    buff[i++] = x12;
         
    buff[i++] = x13 & 255; x13 >>>= 8;
    buff[i++] = x13 & 255; x13 >>>= 8;
    buff[i++] = x13 & 255; x13 >>>= 8;
    buff[i++] = x13;
         
    buff[i++] = x14 & 255; x14 >>>= 8;
    buff[i++] = x14 & 255; x14 >>>= 8;
    buff[i++] = x14 & 255; x14 >>>= 8;
    buff[i++] = x14;
         
    buff[i++] = x15 & 255; x15 >>>= 8;
    buff[i++] = x15 & 255; x15 >>>= 8;
    buff[i++] = x15 & 255; x15 >>>= 8;
    buff[i++] = x15;        
    
    }
 }

module.exports = {
    ecdh: ecdh,
    hexToBytes: hexToBytes,
    randomPrivate: randomPrivate,
    pubFromPriv: pubFromPriv,
    sharedSecret: sharedSecret,
    chachaSetup: chachaSetup,
    chachaFill: chachaFill
}