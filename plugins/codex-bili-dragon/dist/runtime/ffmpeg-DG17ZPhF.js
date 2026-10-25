import { n as dataRoot } from "./paths-5G6hh4eK.js";
import path from "node:path";
import { execFile } from "node:child_process";
import fs from "node:fs";
import { createHash } from "node:crypto";
import { promisify } from "node:util";
import { createRequire } from "module";
// ../../node_modules/.pnpm/fflate@0.8.3/node_modules/fflate/esm/index.mjs
var require = createRequire("/");
var _a;
try {
	_a = require("worker_threads"), _a.Worker, _a.isMarkedAsUntransferable;
} catch (e) {}
var u8 = Uint8Array;
var u16 = Uint16Array;
var i32 = Int32Array;
var fleb = new u8([
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	1,
	1,
	1,
	1,
	2,
	2,
	2,
	2,
	3,
	3,
	3,
	3,
	4,
	4,
	4,
	4,
	5,
	5,
	5,
	5,
	0,
	0,
	0,
	0
]);
var fdeb = new u8([
	0,
	0,
	0,
	0,
	1,
	1,
	2,
	2,
	3,
	3,
	4,
	4,
	5,
	5,
	6,
	6,
	7,
	7,
	8,
	8,
	9,
	9,
	10,
	10,
	11,
	11,
	12,
	12,
	13,
	13,
	0,
	0
]);
var clim = new u8([
	16,
	17,
	18,
	0,
	8,
	7,
	9,
	6,
	10,
	5,
	11,
	4,
	12,
	3,
	13,
	2,
	14,
	1,
	15
]);
var freb = function(eb, start) {
	var b = new u16(31);
	for (var i = 0; i < 31; ++i) b[i] = start += 1 << eb[i - 1];
	var r = new i32(b[30]);
	for (var i = 1; i < 30; ++i) for (var j = b[i]; j < b[i + 1]; ++j) r[j] = j - b[i] << 5 | i;
	return {
		b,
		r
	};
};
var _a = freb(fleb, 2);
var fl = _a.b;
var revfl = _a.r;
fl[28] = 258, revfl[258] = 28;
var _b = freb(fdeb, 0);
var fd = _b.b;
_b.r;
var rev = new u16(32768);
for (var i = 0; i < 32768; ++i) {
	var x = (i & 43690) >> 1 | (i & 21845) << 1;
	x = (x & 52428) >> 2 | (x & 13107) << 2;
	x = (x & 61680) >> 4 | (x & 3855) << 4;
	rev[i] = ((x & 65280) >> 8 | (x & 255) << 8) >> 1;
}
var hMap = (function(cd, mb, r) {
	var s = cd.length;
	var i = 0;
	var l = new u16(mb);
	for (; i < s; ++i) if (cd[i]) ++l[cd[i] - 1];
	var le = new u16(mb);
	for (i = 1; i < mb; ++i) le[i] = le[i - 1] + l[i - 1] << 1;
	var co;
	if (r) {
		co = new u16(1 << mb);
		var rvb = 15 - mb;
		for (i = 0; i < s; ++i) if (cd[i]) {
			var sv = i << 4 | cd[i];
			var r_1 = mb - cd[i];
			var v = le[cd[i] - 1]++ << r_1;
			for (var m = v | (1 << r_1) - 1; v <= m; ++v) co[rev[v] >> rvb] = sv;
		}
	} else {
		co = new u16(s);
		for (i = 0; i < s; ++i) if (cd[i]) co[i] = rev[le[cd[i] - 1]++] >> 15 - cd[i];
	}
	return co;
});
var flt = new u8(288);
for (var i = 0; i < 144; ++i) flt[i] = 8;
for (var i = 144; i < 256; ++i) flt[i] = 9;
for (var i = 256; i < 280; ++i) flt[i] = 7;
for (var i = 280; i < 288; ++i) flt[i] = 8;
var fdt = new u8(32);
for (var i = 0; i < 32; ++i) fdt[i] = 5;
var flrm = /*#__PURE__*/ hMap(flt, 9, 1);
var fdrm = /*#__PURE__*/ hMap(fdt, 5, 1);
var max = function(a) {
	var m = a[0];
	for (var i = 1; i < a.length; ++i) if (a[i] > m) m = a[i];
	return m;
};
var bits = function(d, p, m) {
	var o = p / 8 | 0;
	return (d[o] | d[o + 1] << 8) >> (p & 7) & m;
};
var bits16 = function(d, p) {
	var o = p / 8 | 0;
	return (d[o] | d[o + 1] << 8 | d[o + 2] << 16) >> (p & 7);
};
var shft = function(p) {
	return (p + 7) / 8 | 0;
};
var slc = function(v, s, e) {
	if (s == null || s < 0) s = 0;
	if (e == null || e > v.length) e = v.length;
	return new u8(v.subarray(s, e));
};
var ec = [
	"unexpected EOF",
	"invalid block type",
	"invalid length/literal",
	"invalid distance",
	"stream finished",
	"no stream handler",
	,
	"no callback",
	"invalid UTF-8 data",
	"extra field too long",
	"date not in range 1980-2099",
	"filename too long",
	"stream finishing",
	"invalid zip data"
];
var err = function(ind, msg, nt) {
	var e = new Error(msg || ec[ind]);
	e.code = ind;
	if (Error.captureStackTrace) Error.captureStackTrace(e, err);
	if (!nt) throw e;
	return e;
};
var inflt = function(dat, st, buf, dict) {
	var sl = dat.length, dl = dict ? dict.length : 0;
	if (!sl || st.f && !st.l) return buf || new u8(0);
	var noBuf = !buf;
	var resize = noBuf || st.i != 2;
	var noSt = st.i;
	if (noBuf) buf = new u8(sl * 3);
	var cbuf = function(l) {
		var bl = buf.length;
		if (l > bl) {
			var nbuf = new u8(Math.max(bl * 2, l));
			nbuf.set(buf);
			buf = nbuf;
		}
	};
	var final = st.f || 0, pos = st.p || 0, bt = st.b || 0, lm = st.l, dm = st.d, lbt = st.m, dbt = st.n;
	var tbts = sl * 8;
	do {
		if (!lm) {
			final = bits(dat, pos, 1);
			var type = bits(dat, pos + 1, 3);
			pos += 3;
			if (!type) {
				var s = shft(pos) + 4, l = dat[s - 4] | dat[s - 3] << 8, t = s + l;
				if (t > sl) {
					if (noSt) err(0);
					break;
				}
				if (resize) cbuf(bt + l);
				buf.set(dat.subarray(s, t), bt);
				st.b = bt += l, st.p = pos = t * 8, st.f = final;
				continue;
			} else if (type == 1) lm = flrm, dm = fdrm, lbt = 9, dbt = 5;
			else if (type == 2) {
				var hLit = bits(dat, pos, 31) + 257, hcLen = bits(dat, pos + 10, 15) + 4;
				var tl = hLit + bits(dat, pos + 5, 31) + 1;
				pos += 14;
				var ldt = new u8(tl);
				var clt = new u8(19);
				for (var i = 0; i < hcLen; ++i) clt[clim[i]] = bits(dat, pos + i * 3, 7);
				pos += hcLen * 3;
				var clb = max(clt), clbmsk = (1 << clb) - 1;
				var clm = hMap(clt, clb, 1);
				for (var i = 0; i < tl;) {
					var r = clm[bits(dat, pos, clbmsk)];
					pos += r & 15;
					var s = r >> 4;
					if (s < 16) ldt[i++] = s;
					else {
						var c = 0, n = 0;
						if (s == 16) n = 3 + bits(dat, pos, 3), pos += 2, c = ldt[i - 1];
						else if (s == 17) n = 3 + bits(dat, pos, 7), pos += 3;
						else if (s == 18) n = 11 + bits(dat, pos, 127), pos += 7;
						while (n--) ldt[i++] = c;
					}
				}
				var lt = ldt.subarray(0, hLit), dt = ldt.subarray(hLit);
				lbt = max(lt);
				dbt = max(dt);
				lm = hMap(lt, lbt, 1);
				dm = hMap(dt, dbt, 1);
			} else err(1);
			if (pos > tbts) {
				if (noSt) err(0);
				break;
			}
		}
		if (resize) cbuf(bt + 131072);
		var lms = (1 << lbt) - 1, dms = (1 << dbt) - 1;
		var lpos = pos;
		for (;; lpos = pos) {
			var c = lm[bits16(dat, pos) & lms], sym = c >> 4;
			pos += c & 15;
			if (pos > tbts) {
				if (noSt) err(0);
				break;
			}
			if (!c) err(2);
			if (sym < 256) buf[bt++] = sym;
			else if (sym == 256) {
				lpos = pos, lm = null;
				break;
			} else {
				var add = sym - 254;
				if (sym > 264) {
					var i = sym - 257, b = fleb[i];
					add = bits(dat, pos, (1 << b) - 1) + fl[i];
					pos += b;
				}
				var d = dm[bits16(dat, pos) & dms], dsym = d >> 4;
				if (!d) err(3);
				pos += d & 15;
				var dt = fd[dsym];
				if (dsym > 3) {
					var b = fdeb[dsym];
					dt += bits16(dat, pos) & (1 << b) - 1, pos += b;
				}
				if (pos > tbts) {
					if (noSt) err(0);
					break;
				}
				if (resize) cbuf(bt + 131072);
				var end = bt + add;
				if (bt < dt) {
					var shift = dl - dt, dend = Math.min(dt, end);
					if (shift + bt < 0) err(3);
					for (; bt < dend; ++bt) buf[bt] = dict[shift + bt];
				}
				for (; bt < end; ++bt) buf[bt] = buf[bt - dt];
			}
		}
		st.l = lm, st.p = lpos, st.b = bt, st.f = final;
		if (lm) final = 1, st.m = lbt, st.d = dm, st.n = dbt;
	} while (!final);
	return bt != buf.length && noBuf ? slc(buf, 0, bt) : buf.subarray(0, bt);
};
var et = /*#__PURE__*/ new u8(0);
var b2 = function(d, b) {
	return d[b] | d[b + 1] << 8;
};
var b4 = function(d, b) {
	return (d[b] | d[b + 1] << 8 | d[b + 2] << 16 | d[b + 3] << 24) >>> 0;
};
var b8 = function(d, b) {
	return b4(d, b) + b4(d, b + 4) * 4294967296;
};
function inflateSync(data, opts) {
	return inflt(data, { i: 2 }, opts && opts.out, opts && opts.dictionary);
}
var td = typeof TextDecoder != "undefined" && /*#__PURE__*/ new TextDecoder();
try {
	td.decode(et, { stream: true });
} catch (e) {}
var dutf8 = function(d) {
	for (var r = "", i = 0;;) {
		var c = d[i++];
		var eb = (c > 127) + (c > 223) + (c > 239);
		if (i + eb > d.length) return {
			s: r,
			r: slc(d, i - 1)
		};
		if (!eb) r += String.fromCharCode(c);
		else if (eb == 3) c = ((c & 15) << 18 | (d[i++] & 63) << 12 | (d[i++] & 63) << 6 | d[i++] & 63) - 65536, r += String.fromCharCode(55296 | c >> 10, 56320 | c & 1023);
		else if (eb & 1) r += String.fromCharCode((c & 31) << 6 | d[i++] & 63);
		else r += String.fromCharCode((c & 15) << 12 | (d[i++] & 63) << 6 | d[i++] & 63);
	}
};
/**
* Converts a Uint8Array to a string
* @param dat The data to decode to string
* @param latin1 Whether or not to interpret the data as Latin-1. This should
*               not need to be true unless encoding to binary string.
* @returns The original UTF-8/Latin-1 string
*/
function strFromU8(dat, latin1) {
	if (latin1) {
		var r = "";
		for (var i = 0; i < dat.length; i += 16384) r += String.fromCharCode.apply(null, dat.subarray(i, i + 16384));
		return r;
	} else if (td) return td.decode(dat);
	else {
		var _a = dutf8(dat), s = _a.s, r = _a.r;
		if (r.length) err(8);
		return s;
	}
}
var slzh = function(d, b) {
	return b + 30 + b2(d, b + 26) + b2(d, b + 28);
};
var zh = function(d, b, z) {
	var fnl = b2(d, b + 28), efl = b2(d, b + 30), fn = strFromU8(d.subarray(b + 46, b + 46 + fnl), !(b2(d, b + 8) & 2048)), es = b + 46 + fnl;
	var _a = z64hs(d, es, efl, z, b4(d, b + 20), b4(d, b + 24), b4(d, b + 42)), sc = _a[0], su = _a[1], off = _a[2];
	return [
		b2(d, b + 10),
		sc,
		su,
		fn,
		es + efl + b2(d, b + 32),
		off
	];
};
var z64hs = function(d, b, l, z, sc, su, off) {
	var nsc = sc == 4294967295, nsu = su == 4294967295, noff = off == 4294967295, e = b + l;
	var nf = nsc + nsu + noff;
	if (z && nf) {
		for (; b + 4 < e; b += 4 + b2(d, b + 2)) if (b2(d, b) == 1) return [
			nsc ? b8(d, b + 4 + 8 * nsu) : sc,
			nsu ? b8(d, b + 4) : su,
			noff ? b8(d, b + 4 + 8 * (nsu + nsc)) : off,
			1
		];
		if (z < 2) err(13);
	}
	return [
		sc,
		su,
		off,
		0
	];
};
/**
* Synchronously decompresses a ZIP archive. Prefer using `unzip` for better
* performance with more than one file.
* @param data The raw compressed ZIP file
* @param opts The ZIP extraction options
* @returns The decompressed files
*/
function unzipSync(data, opts) {
	var files = {};
	var e = data.length - 22;
	for (; b4(data, e) != 101010256; --e) if (!e || data.length - e > 65558) err(13);
	var c = b2(data, e + 8);
	if (!c) return {};
	var o = b4(data, e + 16);
	var z = b4(data, e - 20) == 117853008;
	if (z) {
		var ze = b4(data, e - 12);
		z = b4(data, ze) == 101075792;
		if (z) {
			c = b4(data, ze + 32);
			o = b4(data, ze + 48);
		}
	}
	var fltr = opts && opts.filter;
	for (var i = 0; i < c; ++i) {
		var _a = zh(data, o, z), c_2 = _a[0], sc = _a[1], su = _a[2], fn = _a[3], no = _a[4], off = _a[5], b = slzh(data, off);
		o = no;
		if (!fltr || fltr({
			name: fn,
			size: sc,
			originalSize: su,
			compression: c_2
		})) {
			if (!c_2) files[fn] = slc(data, b, b + sc);
			else if (c_2 == 8) files[fn] = inflateSync(data.subarray(b, b + sc), { out: new u8(su) });
			else err(14, "unknown compression type " + c_2);
		}
	}
	return files;
}
// src/ffmpeg-assets.json
var ffmpeg_assets_default = {
	"win32-x64": {
		"version": "9.0.2-17-g2a571b6068",
		"url": "https://github.com/BtbN/FFmpeg-Builds/releases/download/autobuild-2026-09-30-13-08/ffmpeg-n9.0.2-17-g2a571b6068-win64-lgpl-shared-9.0.zip",
		"sha256": "7157177b8a6cb2174c1650ba8c71b363f2c78cba5330f88c4c02cf5b2b880646",
		"root": "ffmpeg-n9.0.2-17-g2a571b6068-win64-lgpl-shared-9.0",
		"format": "zip",
		"source": "https://github.com/BtbN/FFmpeg-Builds/tree/autobuild-2026-09-30-13-08",
		"minimum": "Windows 10 22H2"
	},
	"win32-arm64": {
		"version": "9.0.2-17-g2a571b6068",
		"url": "https://github.com/BtbN/FFmpeg-Builds/releases/download/autobuild-2026-09-30-13-08/ffmpeg-n9.0.2-17-g2a571b6068-winarm64-lgpl-shared-9.0.zip",
		"sha256": "f3133abf5c2b6ae45bd428d480cf830a9fbda3a3866dc249110e85f99f13b8ce",
		"root": "ffmpeg-n9.0.2-17-g2a571b6068-winarm64-lgpl-shared-9.0",
		"format": "zip",
		"source": "https://github.com/BtbN/FFmpeg-Builds/tree/autobuild-2026-09-30-13-08",
		"minimum": "Windows 10 22H2"
	},
	"linux-x64": {
		"version": "9.0.2-17-g2a571b6068",
		"url": "https://github.com/BtbN/FFmpeg-Builds/releases/download/autobuild-2026-09-30-13-08/ffmpeg-n9.0.2-17-g2a571b6068-linux64-lgpl-shared-9.0.tar.xz",
		"sha256": "7a1ba2af36e5beeb98151e766a903b1d115f2206a86571f17f873cd7292c424f",
		"root": "ffmpeg-n9.0.2-17-g2a571b6068-linux64-lgpl-shared-9.0",
		"format": "tar",
		"source": "https://github.com/BtbN/FFmpeg-Builds/tree/autobuild-2026-09-30-13-08",
		"minimum": "glibc 2.28 / Linux 4.18"
	},
	"linux-arm64": {
		"version": "9.0.2-17-g2a571b6068",
		"url": "https://github.com/BtbN/FFmpeg-Builds/releases/download/autobuild-2026-09-30-13-08/ffmpeg-n9.0.2-17-g2a571b6068-linuxarm64-lgpl-shared-9.0.tar.xz",
		"sha256": "1aa02c59afe06dea2602b40517a5cb75c0ff6d524f217b5aea1f0ca07977cd51",
		"root": "ffmpeg-n9.0.2-17-g2a571b6068-linuxarm64-lgpl-shared-9.0",
		"format": "tar",
		"source": "https://github.com/BtbN/FFmpeg-Builds/tree/autobuild-2026-09-30-13-08",
		"minimum": "glibc 2.28 / Linux 4.18"
	},
	"darwin-x64": {
		"version": "9.0.1-1",
		"url": "https://github.com/dfloresc/ffmpeg-macos-builds/releases/download/v9.0.1-1/ffmpeg-9.0.1-1-lgpl-macos-x86_64.tar.xz",
		"sha256": "d63ad731cbf1eb71c2055130fedfbd7e49edd60a9815ab763e72ba802c1ac666",
		"root": "ffmpeg-9.0.1-1-lgpl-macos-x86_64",
		"format": "tar",
		"source": "https://github.com/dfloresc/ffmpeg-macos-builds/releases/tag/v9.0.1-1",
		"minimum": "macOS 12"
	},
	"darwin-arm64": {
		"version": "9.0.1-1",
		"url": "https://github.com/dfloresc/ffmpeg-macos-builds/releases/download/v9.0.1-1/ffmpeg-9.0.1-1-lgpl-macos-arm64.tar.xz",
		"sha256": "d0ea5ea43a5adfa5d01d4137c9e5a61728b800a812f12917a26fd7af0c14c03a",
		"root": "ffmpeg-9.0.1-1-lgpl-macos-arm64",
		"format": "tar",
		"source": "https://github.com/dfloresc/ffmpeg-macos-builds/releases/tag/v9.0.1-1",
		"minimum": "macOS 12"
	}
};
// src/ffmpeg.ts
const execute = promisify(execFile);
const pending = /* @__PURE__ */ new Map();
function selectFfmpegAsset(platform = process.platform, arch = process.arch) {
	const asset = ffmpeg_assets_default[platform + "-" + arch];
	if (!asset) throw Error(`暂不支持自动安装 FFmpeg：${platform}/${arch}，可通过 FFMPEG 指定可执行文件`);
	return asset;
}
function dependencyDirectory(dir, platform, arch, asset) {
	return path.join(dir, "dependencies/ffmpeg", `${platform}-${arch}-${asset.version}-${asset.sha256.slice(0, 12)}`);
}
function fileExists(file) {
	if (!file) return false;
	try {
		return fs.statSync(file).isFile();
	} catch {
		return false;
	}
}
function findFfmpeg(dir = dataRoot, env = process.env) {
	if (fileExists(env.FFMPEG)) return path.resolve(env.FFMPEG);
	const exe = process.platform === "win32" ? "ffmpeg.exe" : "ffmpeg";
	try {
		const asset = selectFfmpegAsset();
		const cached = path.join(dependencyDirectory(dir, process.platform, process.arch, asset), "bin", exe);
		if (fileExists(cached)) return cached;
	} catch {}
	for (const directory of (env.PATH ?? "").split(path.delimiter)) {
		if (!directory) continue;
		const file = path.resolve(directory, exe);
		if (fileExists(file)) return file;
	}
	return null;
}
async function verifyExecutable(file) {
	const { stdout } = await execute(file, ["-hide_banner", "-version"], {
		windowsHide: true,
		timeout: 15e3
	});
	if (!stdout.startsWith("ffmpeg version ")) throw Error("FFmpeg 可执行文件验证失败");
}
async function downloadArchive(url) {
	const response = await fetch(url, { signal: AbortSignal.timeout(3e5) });
	if (!response.ok || !response.body) throw Error(`FFmpeg 下载失败：HTTP ${response.status}，请重新运行安装命令`);
	const chunks = [];
	let size = 0;
	for await (const chunk of response.body) {
		size += chunk.byteLength;
		if (size > 268435456) throw Error("FFmpeg 下载文件超出预期大小");
		chunks.push(chunk);
	}
	return Buffer.concat(chunks);
}
function archiveRelative(name, root) {
	const normalized = name.replaceAll("\\", "/");
	if (normalized.startsWith("/") || normalized.includes(":") || normalized.split("/").includes("..") || normalized !== root && !normalized.startsWith(root + "/")) throw Error("FFmpeg 压缩包包含无效路径");
	return normalized.slice(root.length).replace(/^\//, "");
}
function checkExtractedPaths(directory) {
	const base = fs.realpathSync(directory);
	const walk = (current) => {
		for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
			const file = path.join(current, entry.name);
			const relative = path.relative(base, fs.realpathSync(file));
			if (relative.startsWith("..") || path.isAbsolute(relative)) throw Error("FFmpeg 压缩包包含无效路径");
			if (entry.isDirectory()) walk(file);
		}
	};
	walk(directory);
}
async function ensureFfmpeg(dir = dataRoot, options = {}) {
	const platform = options.platform ?? process.platform, arch = options.arch ?? process.arch;
	const env = options.env ?? process.env, verify = options.verify ?? verifyExecutable;
	if (env.FFMPEG) {
		if (!path.isAbsolute(env.FFMPEG) || !fileExists(env.FFMPEG)) throw Error("FFMPEG 必须指向存在的可执行文件绝对路径");
		await verify(env.FFMPEG);
		return env.FFMPEG;
	}
	const asset = options.asset ?? selectFfmpegAsset(platform, arch);
	const destination = dependencyDirectory(path.resolve(dir), platform, arch, asset);
	const exe = platform === "win32" ? "ffmpeg.exe" : "ffmpeg";
	const executable = path.join(destination, "bin", exe);
	if (fileExists(executable)) {
		await verify(executable);
		return executable;
	}
	if (!options.platform && !options.arch) {
		const existing = findFfmpeg(dir, env);
		if (existing) try {
			await verify(existing);
			return existing;
		} catch {}
	}
	const active = pending.get(destination);
	if (active) return active;
	const prepare = async () => {
		const parent = path.dirname(destination);
		fs.mkdirSync(parent, {
			recursive: true,
			mode: 448
		});
		const temporary = fs.mkdtempSync(path.join(parent, ".download-"));
		try {
			options.progress?.(`正在下载 FFmpeg ${asset.version}（${platform}/${arch}）…`);
			const archive = await (options.download ?? downloadArchive)(asset.url);
			if (createHash("sha256").update(archive).digest("hex") !== asset.sha256) throw Error("FFmpeg 下载文件校验失败，请重新运行安装命令");
			const unpacked = path.join(temporary, "unpacked");
			fs.mkdirSync(unpacked);
			if (asset.format === "zip") for (const [name, bytes] of Object.entries(unzipSync(archive))) {
				const relative = archiveRelative(name, asset.root);
				if (!relative || name.endsWith("/")) continue;
				const output = path.join(unpacked, relative);
				fs.mkdirSync(path.dirname(output), { recursive: true });
				fs.writeFileSync(output, bytes);
			}
			else {
				const downloaded = path.join(temporary, "download.tar.xz");
				fs.writeFileSync(downloaded, archive);
				const { stdout } = await execute("tar", ["-tf", downloaded], {
					windowsHide: true,
					timeout: 3e4,
					maxBuffer: 4194304
				});
				for (const name of stdout.split(/\r?\n/).filter(Boolean)) archiveRelative(name.replace(/\/$/, ""), asset.root);
				await execute("tar", [
					"-xf",
					downloaded,
					"--strip-components=1",
					"-C",
					unpacked
				], {
					windowsHide: true,
					timeout: 6e4
				});
				checkExtractedPaths(unpacked);
			}
			const candidate = path.join(unpacked, "bin", exe);
			if (!fileExists(candidate)) throw Error("FFmpeg 下载包缺少可执行文件");
			if (platform !== "win32") fs.chmodSync(candidate, 493);
			await verify(candidate);
			fs.writeFileSync(path.join(unpacked, "dragon-dependency.json"), JSON.stringify({
				...asset,
				platform,
				arch
			}, null, 2) + "\n");
			try {
				fs.renameSync(unpacked, destination);
			} catch (error) {
				if (!fileExists(executable)) throw error;
				await verify(executable);
			}
			options.progress?.("FFmpeg 已安装并验证。");
			return executable;
		} finally {
			const relative = path.relative(parent, temporary);
			if (relative.startsWith(".download-") && !relative.includes(path.sep)) fs.rmSync(temporary, {
				recursive: true,
				force: true
			});
		}
	};
	const task = prepare().finally(() => pending.delete(destination));
	pending.set(destination, task);
	return task;
}
export { findFfmpeg as n, ensureFfmpeg as t };

//# sourceMappingURL=ffmpeg-DG17ZPhF.js.map