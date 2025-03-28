/*
 * Copyright (C) 2005, 2006, 2008, 2010, 2013 Apple Inc. All rights reserved.
 * Copyright (C) 2010 Patrick Gansterer <paroga@paroga.com>
 *
 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Library General Public
 * License as published by the Free Software Foundation; either
 * version 2 of the License, or (at your option) any later version.
 *
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Library General Public License for more details.
 *
 * You should have received a copy of the GNU Library General Public License
 * along with this library; see the file COPYING.LIB.  If not, write to
 * the Free Software Foundation, Inc., 51 Franklin Street, Fifth Floor,
 * Boston, MA 02110-1301, USA.
 *
 */

#ifndef THIRD_PARTY_BLINK_RENDERER_PLATFORM_WTF_TEXT_STRING_HASHER_H_
#define THIRD_PARTY_BLINK_RENDERER_PLATFORM_WTF_TEXT_STRING_HASHER_H_


#include <stdint.h>
#include <cstring>
#include <type_traits>
#include "rapidHash.h"

#define DCHECK_EQ(left, right)                                        \
  do {                                                                \
    const auto& _left_val = (left);         \
    const auto& _right_val = (right);        \
    if (!(_left_val == _right_val)) {                                 \
      std::cerr << "DCHECK_EQ failed: " << #left << " == " << #right << "\n" \
          << "  Actual values: " << #left << " = " << _left_val << "\n" \
          << "               " << #right << " = " << _right_val << "\n" \
          << "  Location: " << __FILE__ << ":" << __LINE__;           \
      std::abort();                                                   \
    }                                                                 \
  } while (0)



// These definitions should be matched to
// third_party/icu/source/common/unicode/umachine.h.
typedef char16_t UChar;
typedef int32_t UChar32;
static_assert(sizeof(UChar) == 2, "UChar should be two bytes");

// Define platform neutral 8 bit character type (L is for Latin-1).
typedef unsigned char LChar;

namespace WTF {

// Paul Hsieh's SuperFastHash
// http://www.azillionmonkeys.com/qed/hash.html

// LChar data is interpreted as Latin-1-encoded (zero extended to 16 bits).

// NOTE: The hash computation here must stay in sync with
// build/scripts/hasher.py.

// Golden ratio. Arbitrary start value to avoid mapping all zeros to a hash
// value of zero.
static const unsigned kStringHashingStartValue = 0x9E3779B9U;

class StringHasher {

 public:
  static const unsigned kFlagCount =
      8;  // Save 8 bits for StringImpl to use as flags.

  StringHasher()
      : hash_(kStringHashingStartValue),
        has_pending_character_(false),
        pending_character_(0) {}

  // The hasher hashes two characters at a time, and thus an "aligned" hasher is
  // one where an even number of characters have been added. Callers that
  // always add characters two at a time can use the "assuming aligned"
  // functions.
  void AddCharactersAssumingAligned(UChar a, UChar b) {
    hash_ += a;
    hash_ = (hash_ << 16) ^ ((b << 11) ^ hash_);
    hash_ += hash_ >> 11;
  }

  void AddCharacter(UChar character) {
    if (has_pending_character_) {
      has_pending_character_ = false;
      AddCharactersAssumingAligned(pending_character_, character);
      return;
    }

    pending_character_ = character;
    has_pending_character_ = true;
  }

  void AddCharacters(UChar a, UChar b) {
    if (has_pending_character_) {
      has_pending_character_ = false;
      AddCharactersAssumingAligned(pending_character_, a);
      pending_character_ = b;
      has_pending_character_ = true;
      return;
    }

    AddCharactersAssumingAligned(a, b);
  }

  template <typename T, UChar Converter(T)>
  void AddCharactersAssumingAligned(const T* data, unsigned length) {

    bool remainder = length & 1;
    length >>= 1;

    while (length--) {
      AddCharactersAssumingAligned(Converter(data[0]), Converter(data[1]));
      data += 2;
    }

    if (remainder)
      AddCharacter(Converter(*data));
  }

  template <typename T>
  void AddCharactersAssumingAligned(const T* data, unsigned length) {
    AddCharactersAssumingAligned<T, DefaultConverter>(data, length);
  }

  template <typename T, UChar Converter(T)>
  void AddCharacters(const T* data, unsigned length) {
    if (has_pending_character_ && length) {
      has_pending_character_ = false;
      AddCharactersAssumingAligned(pending_character_, Converter(*data++));
      --length;
    }
    AddCharactersAssumingAligned<T, Converter>(data, length);
  }

  template <typename T>
  void AddCharacters(const T* data, unsigned length) {
    AddCharacters<T, DefaultConverter>(data, length);
  }

  unsigned HashWithTop8BitsMasked() const {
    unsigned result = AvalancheBits();

    // Reserving space from the high bits for flags preserves most of the hash's
    // value, since hash lookup typically masks out the high bits anyway.
    result &= (1U << (sizeof(result) * 8 - kFlagCount)) - 1;

    // This avoids ever returning a hash code of 0, since that is used to
    // signal "hash not computed yet". Setting the high bit maintains
    // reasonable fidelity to a hash code of 0 because it is likely to yield
    // exactly 0 when hash lookup masks out the high bits.
    if (!result)
      result = 0x80000000 >> kFlagCount;

    return result;
  }

  unsigned GetHash() const {
    unsigned result = AvalancheBits();

    // This avoids ever returning a hash code of 0, since that is used to
    // signal "hash not computed yet". Setting the high bit maintains
    // reasonable fidelity to a hash code of 0 because it is likely to yield
    // exactly 0 when hash lookup masks out the high bits.
    if (!result)
      result = 0x80000000;

    return result;
  }

  template <typename T, UChar Converter(T)>
  static unsigned ComputeHashAndMaskTop8Bits(const T* data, unsigned length) {
    StringHasher hasher;
    hasher.AddCharactersAssumingAligned<T, Converter>(data, length);
    return hasher.HashWithTop8BitsMasked();
  }

  template <typename T>
  static unsigned ComputeHashAndMaskTop8Bits(const T* data, unsigned length) {
    return ComputeHashAndMaskTop8Bits<T, DefaultConverter>(data, length);
  }

  template <typename T, UChar Converter(T)>
  static unsigned ComputeHash(const T* data, unsigned length) {
    StringHasher hasher;
    hasher.AddCharactersAssumingAligned<T, Converter>(data, length);
    return hasher.GetHash();
  }

  template <typename T>
  static unsigned ComputeHash(const T* data, unsigned length) {
    return ComputeHash<T, DefaultConverter>(data, length);
  }

  static unsigned HashMemory(const void* data, unsigned length) {
    // FIXME: Why does this function use the version of the hash that drops the
    // top 8 bits?  We want that for all string hashing so we can use those
    // bits in StringImpl and hash strings consistently, but I don't see why
    // we'd want that for general memory hashing.
    return ComputeHashAndMaskTop8Bits<UChar>(static_cast<const UChar*>(data),
                                             length / sizeof(UChar));
  }

  template <size_t length>
  static unsigned HashMemory(const void* data) {
    static_assert(!(length % 2), "length must be a multiple of two");
    return HashMemory(data, length);
  }

 private:
  // The StringHasher works on UChar so all converters should normalize input
  // data into being a UChar.
  static UChar DefaultConverter(UChar character) { return character; }
  static UChar DefaultConverter(LChar character) { return character; }

  unsigned AvalancheBits() const {
    unsigned result = hash_;

    // Handle end case.
    if (has_pending_character_) {
      result += pending_character_;
      result ^= result << 11;
      result += result >> 17;
    }

    // Force "avalanching" of final 31 bits.
    result ^= result << 3;
    result += result >> 5;
    result ^= result << 2;
    result += result >> 15;
    result ^= result << 10;

    return result;
  }

  unsigned hash_;
  bool has_pending_character_;
  UChar pending_character_;
};


// Table is based on ftp://ftp.unicode.org/Public/UNIDATA/CaseFolding.txt
const UChar kLatin1CaseFoldTable[256] = {
  0x0000, 0x0001, 0x0002, 0x0003, 0x0004, 0x0005, 0x0006, 0x0007, 0x0008,
  0x0009, 0x000a, 0x000b, 0x000c, 0x000d, 0x000e, 0x000f, 0x0010, 0x0011,
  0x0012, 0x0013, 0x0014, 0x0015, 0x0016, 0x0017, 0x0018, 0x0019, 0x001a,
  0x001b, 0x001c, 0x001d, 0x001e, 0x001f, 0x0020, 0x0021, 0x0022, 0x0023,
  0x0024, 0x0025, 0x0026, 0x0027, 0x0028, 0x0029, 0x002a, 0x002b, 0x002c,
  0x002d, 0x002e, 0x002f, 0x0030, 0x0031, 0x0032, 0x0033, 0x0034, 0x0035,
  0x0036, 0x0037, 0x0038, 0x0039, 0x003a, 0x003b, 0x003c, 0x003d, 0x003e,
  0x003f, 0x0040, 0x0061, 0x0062, 0x0063, 0x0064, 0x0065, 0x0066, 0x0067,
  0x0068, 0x0069, 0x006a, 0x006b, 0x006c, 0x006d, 0x006e, 0x006f, 0x0070,
  0x0071, 0x0072, 0x0073, 0x0074, 0x0075, 0x0076, 0x0077, 0x0078, 0x0079,
  0x007a, 0x005b, 0x005c, 0x005d, 0x005e, 0x005f, 0x0060, 0x0061, 0x0062,
  0x0063, 0x0064, 0x0065, 0x0066, 0x0067, 0x0068, 0x0069, 0x006a, 0x006b,
  0x006c, 0x006d, 0x006e, 0x006f, 0x0070, 0x0071, 0x0072, 0x0073, 0x0074,
  0x0075, 0x0076, 0x0077, 0x0078, 0x0079, 0x007a, 0x007b, 0x007c, 0x007d,
  0x007e, 0x007f, 0x0080, 0x0081, 0x0082, 0x0083, 0x0084, 0x0085, 0x0086,
  0x0087, 0x0088, 0x0089, 0x008a, 0x008b, 0x008c, 0x008d, 0x008e, 0x008f,
  0x0090, 0x0091, 0x0092, 0x0093, 0x0094, 0x0095, 0x0096, 0x0097, 0x0098,
  0x0099, 0x009a, 0x009b, 0x009c, 0x009d, 0x009e, 0x009f, 0x00a0, 0x00a1,
  0x00a2, 0x00a3, 0x00a4, 0x00a5, 0x00a6, 0x00a7, 0x00a8, 0x00a9, 0x00aa,
  0x00ab, 0x00ac, 0x00ad, 0x00ae, 0x00af, 0x00b0, 0x00b1, 0x00b2, 0x00b3,
  0x00b4, 0x03bc, 0x00b6, 0x00b7, 0x00b8, 0x00b9, 0x00ba, 0x00bb, 0x00bc,
  0x00bd, 0x00be, 0x00bf, 0x00e0, 0x00e1, 0x00e2, 0x00e3, 0x00e4, 0x00e5,
  0x00e6, 0x00e7, 0x00e8, 0x00e9, 0x00ea, 0x00eb, 0x00ec, 0x00ed, 0x00ee,
  0x00ef, 0x00f0, 0x00f1, 0x00f2, 0x00f3, 0x00f4, 0x00f5, 0x00f6, 0x00d7,
  0x00f8, 0x00f9, 0x00fa, 0x00fb, 0x00fc, 0x00fd, 0x00fe, 0x00df, 0x00e0,
  0x00e1, 0x00e2, 0x00e3, 0x00e4, 0x00e5, 0x00e6, 0x00e7, 0x00e8, 0x00e9,
  0x00ea, 0x00eb, 0x00ec, 0x00ed, 0x00ee, 0x00ef, 0x00f0, 0x00f1, 0x00f2,
  0x00f3, 0x00f4, 0x00f5, 0x00f6, 0x00f7, 0x00f8, 0x00f9, 0x00fa, 0x00fb,
  0x00fc, 0x00fd, 0x00fe, 0x00ff,
};
template <class T>
struct CaseFoldingHashReader {
  // We never contract 16 to 8 bits, so this must always be 1.
  static constexpr unsigned kCompressionFactor = 1;

  // We always produce UTF-16 output, even if we take in Latin1.
  static constexpr unsigned kExpansionFactor = sizeof(UChar) / sizeof(T);

  static inline uint64_t Read64(const uint8_t* ptr) {
    const T* p = reinterpret_cast<const T*>(ptr);
    return FoldCase(p[0]) | (FoldCase(p[1]) << 16) | (FoldCase(p[2]) << 32) |
      (FoldCase(p[3]) << 48);
  }

  static inline uint64_t Read32(const uint8_t* ptr) {
    const T* p = reinterpret_cast<const T*>(ptr);
    return FoldCase(p[0]) | (FoldCase(p[1]) << 16);
  }

  static inline uint64_t ReadSmall(const uint8_t* ptr, size_t k) {
    const T* p = reinterpret_cast<const T*>(ptr);
    DCHECK_EQ(k, 2u);
    return FoldCase(p[0]);
  }

private:
  // Private so no one uses this in the belief that it will return the
  // correctly-folded code point in all cases (see comment below).
  static inline uint64_t FoldCase(T ch) {
    return kLatin1CaseFoldTable[ch];
  }
};

class StringHasherV2 {

public:
  static const unsigned kFlagCount =
    8;  // Save 8 bits for StringImpl to use as flags.

  // The main entry point for the string hasher. Computes the hash and returns
  // only the lowest 24 bits, since that's what we have room for in StringImpl.
  //
  // NOTE: length is the number of bytes produced _by the reader_.
  // Normally, this means that the number of bytes actually read will be
  // equivalent to (length * Reader::kCompressionFactor /
  // Reader::kExpansionFactor). Also note that if you are hashing something
  // that is not 8-bit elements, and do _not_ use compression factors or
  // similar, you'll need to multiply by sizeof(T) to get all data read.
  template <class Reader = PlainHashReader>
  static unsigned ComputeHashAndMaskTop8Bits(const char* data,
    unsigned length) {
    return MaskTop8Bits(
      rapidhash<Reader>(reinterpret_cast<const uint8_t*>(data), length));
  }
  // Hashing can be very performance-sensitive, but the hashing function is also
  // fairly big (~300 bytes on x86-64, give or take). This function is exactly
  // equivalent to ComputeHashAndMaskTop8Bits(), except that it is marked as
  // inline and thus will be force-inlined into your own code. You should
  // use this if all of these are true:
  //
  //   1. You are in a frequently-called place, i.e. you are performance
  //   sensitive.
  //   2. You frequently hash short strings, so that the function call overhead
  //      dominates; for hashing e.g. 1 kB of data, this makes no sense to call.
  //   3. The gain of increased performance, ideally demonstrated by benchmarks,
  //      outweighs the cost of the binary size increase.
  //
  // Note that the compiler may choose to inline even
  // ComputeHashAndMaskTop8Bits() if it deems it a win; for instance, if you
  // call it with length equivalent to a small constant known at compile time,
  // the function may be subject to dead-code removal and thus considered small
  // enough to inline. The same goes if you are the only user of your
  // HashReader.
  template <class Reader = PlainHashReader>
  inline static unsigned ComputeHashAndMaskTop8BitsInline(
    const char* data,
    unsigned length) {
    return MaskTop8Bits(
      rapidhash<Reader>(reinterpret_cast<const uint8_t*>(data), length));
  }

  //static uint64_t HashMemory(base::span<const uint8_t> data) {
  //	return rapidhash(data.data(), data.size());
  //}

  //template <size_t Extent>
  //static uint64_t HashMemory(base::span<const uint8_t, Extent> data) {
  //	return rapidhash(data.data(), data.size());
  //}

private:
  static unsigned MaskTop8Bits(uint64_t result) {
    // Reserving space from the high bits for flags preserves most of the hash's
    // value, since hash lookup typically masks out the high bits anyway.
    result &= (1U << (32 - kFlagCount)) - 1;

    // This avoids ever returning a hash code of 0, since that is used to
    // signal "hash not computed yet". Setting the high bit maintains
    // reasonable fidelity to a hash code of 0 because it is likely to yield
    // exactly 0 when hash lookup masks out the high bits.
    if (!result) {
      result = 0x80000000 >> kFlagCount;
    }

    return static_cast<unsigned>(result);
  }
};

}  // namespace WTF

using WTF::StringHasher;
using WTF::StringHasherV2;

#endif  // THIRD_PARTY_BLINK_RENDERER_PLATFORM_WTF_TEXT_STRING_HASHER_H_