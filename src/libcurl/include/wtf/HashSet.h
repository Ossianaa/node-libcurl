/*
 * Copyright (C) 2005-2017 Apple Inc. All rights reserved.
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
#include <iostream>
#include "wtf/string_hasher.h"

#define NDEBUG 1

#include <algorithm>
#include <memory>
#include <stdio.h>
#include <stdlib.h>
#include <time.h>
#define ALWAYS_INLINE inline

#define WTFMove(value) std::move(value)

#define ASSERT(exp) do { } while(0)
#define ASSERT_UNUSED(var, exp) do { (void)(var); } while(0)
#define RELEASE_ASSERT(exp) do {                                        \
        if (!(exp)) {                                                   \
            fprintf(stderr, "%s:%d: assertion failed: %s\n", __FILE__, __LINE__, #exp); \
            abort();                                                    \
        }                                                               \
    } while(0)

#define ASSERT_DISABLED 1

#define DUMP_HASHTABLE_STATS 0
#define DUMP_HASHTABLE_STATS_PER_TABLE 0

// This version of placement new omits a 0 check.
namespace WTF_NONULL {
	enum NotNullTag { NotNull };

}

inline void* operator new(size_t, WTF_NONULL::NotNullTag, void* location)
{
	ASSERT(location);
	return location;
}

namespace WTF {
	inline unsigned CalculateCapacity(unsigned size) {
		for (unsigned mask = size; mask; mask >>= 1)
			size |= mask;         // 00110101010 -> 00111111111
		return (size + 1) * 2;  // 00111111111 -> 10000000000
	}
	inline uint32_t roundUpToPowerOfTwo(uint32_t v)
	{
		v--;
		v |= v >> 1;
		v |= v >> 2;
		v |= v >> 4;
		v |= v >> 8;
		v |= v >> 16;
		v++;
		return v;
	}

	/*
	 * C++'s idea of a reinterpret_cast lacks sufficient cojones.
	 */
	template<typename ToType, typename FromType>
	inline ToType bitwise_cast(FromType from)
	{
		typename std::remove_const<ToType>::type to{ };
		std::memcpy(&to, &from, sizeof(to));
		return to;
	}

	enum HashTableDeletedValueType { HashTableDeletedValue };
	enum HashTableEmptyValueType { HashTableEmptyValue };

	template <typename T> inline T* getPtr(T* p) { return p; }

	template <typename T> struct IsSmartPtr {
		static const bool value = false;
	};

	template <typename T, bool isSmartPtr>
	struct GetPtrHelperBase;

	template <typename T>
	struct GetPtrHelperBase<T, false /* isSmartPtr */> {
		typedef T* PtrType;
		static T* getPtr(T& p) { return std::addressof(p); }
	};

	template <typename T>
	struct GetPtrHelperBase<T, true /* isSmartPtr */> {
		typedef typename T::PtrType PtrType;
		static PtrType getPtr(const T& p) { return p.get(); }
	};

	template <typename T>
	struct GetPtrHelper : GetPtrHelperBase<T, IsSmartPtr<T>::value> {
	};

	template <typename T>
	inline typename GetPtrHelper<T>::PtrType getPtr(T& p)
	{
		return GetPtrHelper<T>::getPtr(p);
	}

	template <typename T>
	inline typename GetPtrHelper<T>::PtrType getPtr(const T& p)
	{
		return GetPtrHelper<T>::getPtr(p);
	}

	// Explicit specialization for C++ standard library types.

	template <typename T, typename Deleter> struct IsSmartPtr<std::unique_ptr<T, Deleter>> {
		static const bool value = true;
	};

	template <typename T, typename Deleter>
	struct GetPtrHelper<std::unique_ptr<T, Deleter>> {
		typedef T* PtrType;
		static T* getPtr(const std::unique_ptr<T, Deleter>& p) { return p.get(); }
	};

	template<size_t size> struct IntTypes;
	template<> struct IntTypes<1> { typedef int8_t SignedType; typedef uint8_t UnsignedType; };
	template<> struct IntTypes<2> { typedef int16_t SignedType; typedef uint16_t UnsignedType; };
	template<> struct IntTypes<4> { typedef int32_t SignedType; typedef uint32_t UnsignedType; };
	template<> struct IntTypes<8> { typedef int64_t SignedType; typedef uint64_t UnsignedType; };

	// integer hash function

	// Thomas Wang's 32 Bit Mix Function: http://www.cris.com/~Ttwang/tech/inthash.htm
	inline unsigned intHash(uint8_t key8)
	{
		unsigned key = key8;
		key += ~(key << 15);
		key ^= (key >> 10);
		key += (key << 3);
		key ^= (key >> 6);
		key += ~(key << 11);
		key ^= (key >> 16);
		return key;
	}

	// Thomas Wang's 32 Bit Mix Function: http://www.cris.com/~Ttwang/tech/inthash.htm
	inline unsigned intHash(uint16_t key16)
	{
		unsigned key = key16;
		key += ~(key << 15);
		key ^= (key >> 10);
		key += (key << 3);
		key ^= (key >> 6);
		key += ~(key << 11);
		key ^= (key >> 16);
		return key;
	}

	// Thomas Wang's 32 Bit Mix Function: http://www.cris.com/~Ttwang/tech/inthash.htm
	inline unsigned intHash(uint32_t key)
	{
		key += ~(key << 15);
		key ^= (key >> 10);
		key += (key << 3);
		key ^= (key >> 6);
		key += ~(key << 11);
		key ^= (key >> 16);
		return key;
	}

	// Thomas Wang's 64 bit Mix Function: http://www.cris.com/~Ttwang/tech/inthash.htm
	inline unsigned intHash(uint64_t key)
	{
		key += ~(key << 32);
		key ^= (key >> 22);
		key += ~(key << 13);
		key ^= (key >> 8);
		key += (key << 3);
		key ^= (key >> 15);
		key += ~(key << 27);
		key ^= (key >> 31);
		return static_cast<unsigned>(key);
	}

	inline unsigned stringHash(std::string key)
	{
		auto a = WTF::StringHasher::ComputeHashAndMaskTop8Bits(reinterpret_cast<const LChar*>(key.data()), key.size());
		return a;
	}
	inline unsigned stringHashV2(std::string key)
	{
		auto a = WTF::StringHasherV2::ComputeHashAndMaskTop8Bits<CaseFoldingHashReader<LChar>>(key.data(), key.size() * 2);
		return a;
	}

	// Compound integer hash method: http://opendatastructures.org/versions/edition-0.1d/ods-java/node33.html#SECTION00832000000000000000
	inline unsigned pairIntHash(unsigned key1, unsigned key2)
	{
		unsigned shortRandom1 = 277951225; // A random 32-bit value.
		unsigned shortRandom2 = 95187966; // A random 32-bit value.
		uint64_t longRandom = 19248658165952622LL; // A random 64-bit value.

		uint64_t product = longRandom * (shortRandom1 * key1 + shortRandom2 * key2);
		unsigned highBits = static_cast<unsigned>(product >> (sizeof(uint64_t) - sizeof(unsigned)));
		return highBits;
	}

	template<typename T> struct IntHash {
		static unsigned hash(T key) { return intHash(static_cast<typename IntTypes<sizeof(T)>::UnsignedType>(key)); }
		static bool equal(T a, T b) { return a == b; }
		static const bool safeToCompareToEmptyOrDeleted = true;
	};

	template<typename T> struct FloatHash {
		typedef typename IntTypes<sizeof(T)>::UnsignedType Bits;
		static unsigned hash(T key)
		{
			return intHash(bitwise_cast<Bits>(key));
		}
		static bool equal(T a, T b)
		{
			return bitwise_cast<Bits>(a) == bitwise_cast<Bits>(b);
		}
		static const bool safeToCompareToEmptyOrDeleted = true;
	};

	struct StringHash {
		static unsigned hash(std::string key) { return stringHash(key); }
		static bool equal(std::string a, std::string b) { return a == b; }
		static const bool safeToCompareToEmptyOrDeleted = false;
	};
	struct StringHashV2 {
		static unsigned hash(std::string key) { return stringHashV2(key); }
		static bool equal(std::string a, std::string b) { return a == b; }
		static const bool safeToCompareToEmptyOrDeleted = false;
	};

	// pointer identity hash function

	template<typename T, bool isSmartPointer>
	struct PtrHashBase;

	template <typename T>
	struct PtrHashBase<T, false /* isSmartPtr */> {
		typedef T PtrType;

		static unsigned hash(PtrType key) { return IntHash<uintptr_t>::hash(reinterpret_cast<uintptr_t>(key)); }
		static bool equal(PtrType a, PtrType b) { return a == b; }
		static const bool safeToCompareToEmptyOrDeleted = true;
	};

	template <typename T>
	struct PtrHashBase<T, true /* isSmartPtr */> {
		typedef typename GetPtrHelper<T>::PtrType PtrType;

		static unsigned hash(PtrType key) { return IntHash<uintptr_t>::hash(reinterpret_cast<uintptr_t>(key)); }
		static bool equal(PtrType a, PtrType b) { return a == b; }
		static const bool safeToCompareToEmptyOrDeleted = true;

		static unsigned hash(const T& key) { return hash(getPtr(key)); }
		static bool equal(const T& a, const T& b) { return getPtr(a) == getPtr(b); }
		static bool equal(PtrType a, const T& b) { return a == getPtr(b); }
		static bool equal(const T& a, PtrType b) { return getPtr(a) == b; }
	};

	template<typename T> struct PtrHash : PtrHashBase<T, IsSmartPtr<T>::value> {
	};

	// default hash function for each type

	template<typename T> struct DefaultHash;

	template<typename T, typename U> struct PairHash {
		static unsigned hash(const std::pair<T, U>& p)
		{
			return pairIntHash(DefaultHash<T>::Hash::hash(p.first), DefaultHash<U>::Hash::hash(p.second));
		}
		static bool equal(const std::pair<T, U>& a, const std::pair<T, U>& b)
		{
			return DefaultHash<T>::Hash::equal(a.first, b.first) && DefaultHash<U>::Hash::equal(a.second, b.second);
		}
		static const bool safeToCompareToEmptyOrDeleted = DefaultHash<T>::Hash::safeToCompareToEmptyOrDeleted && DefaultHash<U>::Hash::safeToCompareToEmptyOrDeleted;
	};

	template<typename T, typename U> struct IntPairHash {
		static unsigned hash(const std::pair<T, U>& p) { return pairIntHash(p.first, p.second); }
		static bool equal(const std::pair<T, U>& a, const std::pair<T, U>& b) { return PairHash<T, T>::equal(a, b); }
		static const bool safeToCompareToEmptyOrDeleted = PairHash<T, U>::safeToCompareToEmptyOrDeleted;
	};

	template<typename... Types>
	struct TupleHash {
		template<size_t I = 0>
		static typename std::enable_if < I < sizeof...(Types) - 1, unsigned>::type hash(const std::tuple<Types...>& t)
		{
			using IthTupleElementType = typename std::tuple_element<I, typename std::tuple<Types...>>::type;
			return pairIntHash(DefaultHash<IthTupleElementType>::Hash::hash(std::get<I>(t)), hash<I + 1>(t));
		}

		template<size_t I = 0>
		static typename std::enable_if<I == sizeof...(Types) - 1, unsigned>::type hash(const std::tuple<Types...>& t)
		{
			using IthTupleElementType = typename std::tuple_element<I, typename std::tuple<Types...>>::type;
			return DefaultHash<IthTupleElementType>::Hash::hash(std::get<I>(t));
		}

		template<size_t I = 0>
		static typename std::enable_if < I < sizeof...(Types) - 1, bool>::type equal(const std::tuple<Types...>& a, const std::tuple<Types...>& b)
		{
			using IthTupleElementType = typename std::tuple_element<I, typename std::tuple<Types...>>::type;
			return DefaultHash<IthTupleElementType>::Hash::equal(std::get<I>(a), std::get<I>(b)) && equal<I + 1>(a, b);
		}

		template<size_t I = 0>
		static typename std::enable_if<I == sizeof...(Types) - 1, bool>::type equal(const std::tuple<Types...>& a, const std::tuple<Types...>& b)
		{
			using IthTupleElementType = typename std::tuple_element<I, typename std::tuple<Types...>>::type;
			return DefaultHash<IthTupleElementType>::Hash::equal(std::get<I>(a), std::get<I>(b));
		}

		// We should use safeToCompareToEmptyOrDeleted = DefaultHash<Types>::Hash::safeToCompareToEmptyOrDeleted &&... whenever
		// we switch to C++17. We can't do anything better here right now because GCC can't do C++.
		template<typename BoolType>
		static constexpr bool allTrue(BoolType value) { return value; }
		template<typename BoolType, typename... BoolTypes>
		static constexpr bool allTrue(BoolType value, BoolTypes... values) { return value && allTrue(values...); }
		static const bool safeToCompareToEmptyOrDeleted = allTrue(DefaultHash<Types>::Hash::safeToCompareToEmptyOrDeleted...);
	};

	// make IntHash the default hash function for many integer types

	template<> struct DefaultHash<bool> { typedef IntHash<uint8_t> Hash; };
	template<> struct DefaultHash<short> { typedef IntHash<unsigned> Hash; };
	template<> struct DefaultHash<unsigned short> { typedef IntHash<unsigned> Hash; };
	template<> struct DefaultHash<int> { typedef IntHash<unsigned> Hash; };
	template<> struct DefaultHash<unsigned> { typedef IntHash<unsigned> Hash; };
	template<> struct DefaultHash<long> { typedef IntHash<unsigned long> Hash; };
	template<> struct DefaultHash<unsigned long> { typedef IntHash<unsigned long> Hash; };
	template<> struct DefaultHash<long long> { typedef IntHash<unsigned long long> Hash; };
	template<> struct DefaultHash<unsigned long long> { typedef IntHash<unsigned long long> Hash; };
#if defined(_NATIVE_WCHAR_T_DEFINED)
	template<> struct DefaultHash<wchar_t> { typedef IntHash<wchar_t> Hash; };
#endif

	template<> struct DefaultHash<float> { typedef FloatHash<float> Hash; };
	template<> struct DefaultHash<double> { typedef FloatHash<double> Hash; };

	// make PtrHash the default hash function for pointer types that don't specialize

	template<typename P> struct DefaultHash<P*> { typedef PtrHash<P*> Hash; };

	template<typename P, typename Deleter> struct DefaultHash<std::unique_ptr<P, Deleter>> { typedef PtrHash<std::unique_ptr<P, Deleter>> Hash; };

	// make IntPairHash the default hash function for pairs of (at most) 32-bit integers.

	template<> struct DefaultHash<std::pair<short, short>> { typedef IntPairHash<short, short> Hash; };
	template<> struct DefaultHash<std::pair<short, unsigned short>> { typedef IntPairHash<short, unsigned short> Hash; };
	template<> struct DefaultHash<std::pair<short, int>> { typedef IntPairHash<short, int> Hash; };
	template<> struct DefaultHash<std::pair<short, unsigned>> { typedef IntPairHash<short, unsigned> Hash; };
	template<> struct DefaultHash<std::pair<unsigned short, short>> { typedef IntPairHash<unsigned short, short> Hash; };
	template<> struct DefaultHash<std::pair<unsigned short, unsigned short>> { typedef IntPairHash<unsigned short, unsigned short> Hash; };
	template<> struct DefaultHash<std::pair<unsigned short, int>> { typedef IntPairHash<unsigned short, int> Hash; };
	template<> struct DefaultHash<std::pair<unsigned short, unsigned>> { typedef IntPairHash<unsigned short, unsigned> Hash; };
	template<> struct DefaultHash<std::pair<int, short>> { typedef IntPairHash<int, short> Hash; };
	template<> struct DefaultHash<std::pair<int, unsigned short>> { typedef IntPairHash<int, unsigned short> Hash; };
	template<> struct DefaultHash<std::pair<int, int>> { typedef IntPairHash<int, int> Hash; };
	template<> struct DefaultHash<std::pair<int, unsigned>> { typedef IntPairHash<unsigned, unsigned> Hash; };
	template<> struct DefaultHash<std::pair<unsigned, short>> { typedef IntPairHash<unsigned, short> Hash; };
	template<> struct DefaultHash<std::pair<unsigned, unsigned short>> { typedef IntPairHash<unsigned, unsigned short> Hash; };
	template<> struct DefaultHash<std::pair<unsigned, int>> { typedef IntPairHash<unsigned, int> Hash; };
	template<> struct DefaultHash<std::pair<unsigned, unsigned>> { typedef IntPairHash<unsigned, unsigned> Hash; };

	// make PairHash the default hash function for pairs of arbitrary values.

	template<typename T, typename U> struct DefaultHash<std::pair<T, U>> { typedef PairHash<T, U> Hash; };
	template<typename... Types> struct DefaultHash<std::tuple<Types...>> { typedef TupleHash<Types...> Hash; };

	template<typename T> struct HashTraits;

	template<bool isInteger, typename T> struct GenericHashTraitsBase;

	template<typename T> struct GenericHashTraitsBase<false, T> {
		// The emptyValueIsZero flag is used to optimize allocation of empty hash tables with zeroed memory.
		static const bool emptyValueIsZero = false;

		// The hasIsEmptyValueFunction flag allows the hash table to automatically generate code to check
		// for the empty value when it can be done with the equality operator, but allows custom functions
		// for cases like String that need them.
		static const bool hasIsEmptyValueFunction = false;

		// The starting table size. Can be overridden when we know beforehand that
		// a hash table will have at least N entries.
		static const unsigned minimumTableSize = 8;
	};

	// Default integer traits disallow both 0 and -1 as keys (max value instead of -1 for unsigned).
	template<typename T> struct GenericHashTraitsBase<true, T> : GenericHashTraitsBase<false, T> {
		static const bool emptyValueIsZero = true;
		static void constructDeletedValue(T& slot) { slot = static_cast<T>(-1); }
		static bool isDeletedValue(T value) { return value == static_cast<T>(-1); }
	};

	template<typename T> struct GenericHashTraits : GenericHashTraitsBase<std::is_integral<T>::value, T> {
		typedef T TraitType;
		typedef T EmptyValueType;

		static T emptyValue() { return T(); }

		template<typename U, typename V>
		static void assignToEmpty(U& emptyValue, V&& value)
		{
			emptyValue = std::forward<V>(value);
		}

		// Type for return value of functions that do not transfer ownership, such as get.
		typedef T PeekType;
		template<typename U> static U&& peek(U&& value) { return std::forward<U>(value); }

		typedef T TakeType;
		template<typename U> static TakeType take(U&& value) { return std::forward<U>(value); }
	};

	template<typename T> struct HashTraits : GenericHashTraits<T> { };

	template<typename T> struct FloatHashTraits : GenericHashTraits<T> {
		static T emptyValue() { return std::numeric_limits<T>::infinity(); }
		static void constructDeletedValue(T& slot) { slot = -std::numeric_limits<T>::infinity(); }
		static bool isDeletedValue(T value) { return value == -std::numeric_limits<T>::infinity(); }
	};

	template<> struct HashTraits<float> : FloatHashTraits<float> { };
	template<> struct HashTraits<double> : FloatHashTraits<double> { };

	struct StringHashTraits : GenericHashTraits<std::string> {
		static bool isDeletedValue(std::string value) { return false; }
	};
	template<> struct HashTraits<std::string> : StringHashTraits { };
	// Default unsigned traits disallow both 0 and max as keys -- use these traits to allow zero and disallow max - 1.
	template<typename T> struct UnsignedWithZeroKeyHashTraits : GenericHashTraits<T> {
		static const bool emptyValueIsZero = false;
		static T emptyValue() { return std::numeric_limits<T>::max(); }
		static void constructDeletedValue(T& slot) { slot = std::numeric_limits<T>::max() - 1; }
		static bool isDeletedValue(T value) { return value == std::numeric_limits<T>::max() - 1; }
	};

	template<typename T> struct SignedWithZeroKeyHashTraits : GenericHashTraits<T> {
		static const bool emptyValueIsZero = false;
		static T emptyValue() { return std::numeric_limits<T>::min(); }
		static void constructDeletedValue(T& slot) { slot = std::numeric_limits<T>::max(); }
		static bool isDeletedValue(T value) { return value == std::numeric_limits<T>::max(); }
	};

	// Can be used with strong enums, allows zero as key.
	template<typename T> struct StrongEnumHashTraits : GenericHashTraits<T> {
		using UnderlyingType = typename std::underlying_type<T>::type;
		static const bool emptyValueIsZero = false;
		static T emptyValue() { return static_cast<T>(std::numeric_limits<UnderlyingType>::max()); }
		static void constructDeletedValue(T& slot) { slot = static_cast<T>(std::numeric_limits<UnderlyingType>::max() - 1); }
		static bool isDeletedValue(T value) { return value == static_cast<T>(std::numeric_limits<UnderlyingType>::max() - 1); }
	};

	template<typename P> struct HashTraits<P*> : GenericHashTraits<P*> {
		static const bool emptyValueIsZero = true;
		static void constructDeletedValue(P*& slot) { slot = reinterpret_cast<P*>(-1); }
		static bool isDeletedValue(P* value) { return value == reinterpret_cast<P*>(-1); }
	};

	template<typename T> struct SimpleClassHashTraits : GenericHashTraits<T> {
		static const bool emptyValueIsZero = true;
		static void constructDeletedValue(T& slot) { new (WTF_NONULL::NotNull, std::addressof(slot)) T(HashTableDeletedValue); }
		static bool isDeletedValue(const T& value) { return value.isHashTableDeletedValue(); }
	};

	template<typename T, typename Deleter> struct HashTraits<std::unique_ptr<T, Deleter>> : SimpleClassHashTraits<std::unique_ptr<T, Deleter>> {
		typedef std::nullptr_t EmptyValueType;
		static EmptyValueType emptyValue() { return nullptr; }

		static void constructDeletedValue(std::unique_ptr<T, Deleter>& slot) { new (WTF_NONULL::NotNull, std::addressof(slot)) std::unique_ptr<T, Deleter> { reinterpret_cast<T*>(-1) }; }
		static bool isDeletedValue(const std::unique_ptr<T, Deleter>& value) { return value.get() == reinterpret_cast<T*>(-1); }

		typedef T* PeekType;
		static T* peek(const std::unique_ptr<T, Deleter>& value) { return value.get(); }
		static T* peek(std::nullptr_t) { return nullptr; }

		static void customDeleteBucket(std::unique_ptr<T, Deleter>& value)
		{
			// The custom delete function exists to avoid a dead store before the value is destructed.
			// The normal destruction sequence of a bucket would be:
			// 1) Call the destructor of unique_ptr.
			// 2) unique_ptr store a zero for its internal pointer.
			// 3) unique_ptr destroys its value.
			// 4) Call constructDeletedValue() to set the bucket as destructed.
			//
			// The problem is the call in (3) prevents the compile from eliminating the dead store in (2)
			// becase a side effect of free() could be observing the value.
			//
			// This version of deleteBucket() ensures the dead 2 stores changing "value"
			// are on the same side of the function call.
			ASSERT(!isDeletedValue(value));
			T* pointer = value.release();
			constructDeletedValue(value);

			// The null case happens if a caller uses std::move() to remove the pointer before calling remove()
			// with an iterator. This is very uncommon.
			if (LIKELY(pointer))
				Deleter()(pointer);
		}
	};

	// This struct template is an implementation detail of the isHashTraitsEmptyValue function,
	// which selects either the emptyValue function or the isEmptyValue function to check for empty values.
	template<typename Traits, bool hasEmptyValueFunction> struct HashTraitsEmptyValueChecker;
	template<typename Traits> struct HashTraitsEmptyValueChecker<Traits, true> {
		template<typename T> static bool isEmptyValue(const T& value) { return Traits::isEmptyValue(value); }
	};
	template<typename Traits> struct HashTraitsEmptyValueChecker<Traits, false> {
		template<typename T> static bool isEmptyValue(const T& value) { return value == Traits::emptyValue(); }
	};
	template<typename Traits, typename T> inline bool isHashTraitsEmptyValue(const T& value)
	{
		return HashTraitsEmptyValueChecker<Traits, Traits::hasIsEmptyValueFunction>::isEmptyValue(value);
	}

	template<typename Traits, typename T>
	struct HashTraitHasCustomDelete {
		static T& bucketArg;
		template<typename X> static std::true_type TestHasCustomDelete(X*, decltype(X::customDeleteBucket(bucketArg))* = nullptr);
		static std::false_type TestHasCustomDelete(...);
		typedef decltype(TestHasCustomDelete(static_cast<Traits*>(nullptr))) ResultType;
		static const bool value = ResultType::value;
	};

	template<typename Traits, typename T>
	typename std::enable_if<HashTraitHasCustomDelete<Traits, T>::value>::type
		hashTraitsDeleteBucket(T& value)
	{
		Traits::customDeleteBucket(value);
	}

	template<typename Traits, typename T>
	typename std::enable_if<!HashTraitHasCustomDelete<Traits, T>::value>::type
		hashTraitsDeleteBucket(T& value)
	{
		value.~T();
		Traits::constructDeletedValue(value);
	}

	template<typename FirstTraitsArg, typename SecondTraitsArg>
	struct PairHashTraits : GenericHashTraits<std::pair<typename FirstTraitsArg::TraitType, typename SecondTraitsArg::TraitType>> {
		typedef FirstTraitsArg FirstTraits;
		typedef SecondTraitsArg SecondTraits;
		typedef std::pair<typename FirstTraits::TraitType, typename SecondTraits::TraitType> TraitType;
		typedef std::pair<typename FirstTraits::EmptyValueType, typename SecondTraits::EmptyValueType> EmptyValueType;

		static const bool emptyValueIsZero = FirstTraits::emptyValueIsZero && SecondTraits::emptyValueIsZero;
		static EmptyValueType emptyValue() { return std::make_pair(FirstTraits::emptyValue(), SecondTraits::emptyValue()); }

		static const unsigned minimumTableSize = FirstTraits::minimumTableSize;

		static void constructDeletedValue(TraitType& slot) { FirstTraits::constructDeletedValue(slot.first); }
		static bool isDeletedValue(const TraitType& value) { return FirstTraits::isDeletedValue(value.first); }
	};

	template<typename First, typename Second>
	struct HashTraits<std::pair<First, Second>> : public PairHashTraits<HashTraits<First>, HashTraits<Second>> { };

	template<typename FirstTrait, typename... Traits>
	struct TupleHashTraits : GenericHashTraits<std::tuple<typename FirstTrait::TraitType, typename Traits::TraitType...>> {
		typedef std::tuple<typename FirstTrait::TraitType, typename Traits::TraitType...> TraitType;
		typedef std::tuple<typename FirstTrait::EmptyValueType, typename Traits::EmptyValueType...> EmptyValueType;

		// We should use emptyValueIsZero = Traits::emptyValueIsZero &&... whenever we switch to C++17. We can't do anything
		// better here right now because GCC can't do C++.
		template<typename BoolType>
		static constexpr bool allTrue(BoolType value) { return value; }
		template<typename BoolType, typename... BoolTypes>
		static constexpr bool allTrue(BoolType value, BoolTypes... values) { return value && allTrue(values...); }
		static const bool emptyValueIsZero = allTrue(FirstTrait::emptyValueIsZero, Traits::emptyValueIsZero...);
		static EmptyValueType emptyValue() { return std::make_tuple(FirstTrait::emptyValue(), Traits::emptyValue()...); }

		static const unsigned minimumTableSize = FirstTrait::minimumTableSize;

		static void constructDeletedValue(TraitType& slot) { FirstTrait::constructDeletedValue(std::get<0>(slot)); }
		static bool isDeletedValue(const TraitType& value) { return FirstTrait::isDeletedValue(std::get<0>(value)); }
	};

	template<typename... Traits>
	struct HashTraits<std::tuple<Traits...>> : public TupleHashTraits<HashTraits<Traits>...> { };

	template<typename KeyTypeArg, typename ValueTypeArg>
	struct KeyValuePair {
		typedef KeyTypeArg KeyType;

		KeyValuePair()
		{
		}

		template<typename K, typename V>
		KeyValuePair(K&& key, V&& value)
			: key(std::forward<K>(key))
			, value(std::forward<V>(value))
		{
		}

		template <typename OtherKeyType, typename OtherValueType>
		KeyValuePair(KeyValuePair<OtherKeyType, OtherValueType>&& other)
			: key(std::forward<OtherKeyType>(other.key))
			, value(std::forward<OtherValueType>(other.value))
		{
		}

		KeyTypeArg key;
		ValueTypeArg value;
	};

	template<typename KeyTraitsArg, typename ValueTraitsArg>
	struct KeyValuePairHashTraits : GenericHashTraits<KeyValuePair<typename KeyTraitsArg::TraitType, typename ValueTraitsArg::TraitType>> {
		typedef KeyTraitsArg KeyTraits;
		typedef ValueTraitsArg ValueTraits;
		typedef KeyValuePair<typename KeyTraits::TraitType, typename ValueTraits::TraitType> TraitType;
		typedef KeyValuePair<typename KeyTraits::EmptyValueType, typename ValueTraits::EmptyValueType> EmptyValueType;
		typedef typename ValueTraitsArg::TraitType ValueType;

		static const bool emptyValueIsZero = KeyTraits::emptyValueIsZero && ValueTraits::emptyValueIsZero;
		static EmptyValueType emptyValue() { return KeyValuePair<typename KeyTraits::EmptyValueType, typename ValueTraits::EmptyValueType>(KeyTraits::emptyValue(), ValueTraits::emptyValue()); }

		static const unsigned minimumTableSize = KeyTraits::minimumTableSize;

		static void constructDeletedValue(TraitType& slot) { KeyTraits::constructDeletedValue(slot.key); }
		static bool isDeletedValue(const TraitType& value) { return KeyTraits::isDeletedValue(value.key); }

		static void customDeleteBucket(TraitType& value)
		{
			static_assert(std::is_trivially_destructible<KeyValuePair<int, int>>::value,
				"The wrapper itself has to be trivially destructible for customDeleteBucket() to make sense, since we do not destruct the wrapper itself.");

			hashTraitsDeleteBucket<KeyTraits>(value.key);
			value.value.~ValueType();
		}
	};

	template<typename Key, typename Value>
	struct HashTraits<KeyValuePair<Key, Value>> : public KeyValuePairHashTraits<HashTraits<Key>, HashTraits<Value>> { };

	template<typename T>
	struct NullableHashTraits : public HashTraits<T> {
		static const bool emptyValueIsZero = false;
		static T emptyValue() { return reinterpret_cast<T>(1); }
	};

	// Useful for classes that want complete control over what is empty and what is deleted,
	// and how to construct both.
	template<typename T>
	struct CustomHashTraits : public GenericHashTraits<T> {
		static const bool emptyValueIsZero = false;
		static const bool hasIsEmptyValueFunction = true;

		static void constructDeletedValue(T& slot)
		{
			new (WTF_NONULL::NotNull, std::addressof(slot)) T(T::DeletedValue);
		}

		static bool isDeletedValue(const T& value)
		{
			return value.isDeletedValue();
		}

		static T emptyValue()
		{
			return T(T::EmptyValue);
		}

		static bool isEmptyValue(const T& value)
		{
			return value.isEmptyValue();
		}
	};

	// Enables internal WTF consistency checks that are invoked automatically. Non-WTF callers can call checkTableConsistency() even if internal checks are disabled.
#define CHECK_HASHTABLE_CONSISTENCY 0

#ifdef NDEBUG
#define CHECK_HASHTABLE_ITERATORS 0
#define CHECK_HASHTABLE_USE_AFTER_DESTRUCTION 0
#else
#define CHECK_HASHTABLE_ITERATORS 1
#define CHECK_HASHTABLE_USE_AFTER_DESTRUCTION 1
#endif

#if DUMP_HASHTABLE_STATS

	struct HashTableStats {
		// The following variables are all atomically incremented when modified.
		WTF_EXPORTDATA static std::atomic<unsigned> numAccesses;
		WTF_EXPORTDATA static std::atomic<unsigned> numRehashes;
		WTF_EXPORTDATA static std::atomic<unsigned> numRemoves;
		WTF_EXPORTDATA static std::atomic<unsigned> numReinserts;

		// The following variables are only modified in the recordCollisionAtCount method within a mutex.
		WTF_EXPORTDATA static unsigned maxCollisions;
		WTF_EXPORTDATA static unsigned numCollisions;
		WTF_EXPORTDATA static unsigned collisionGraph[4096];

		WTF_EXPORT_PRIVATE static void recordCollisionAtCount(unsigned count);
		WTF_EXPORT_PRIVATE static void dumpStats();
	};

#endif

	template<typename Key, typename Value, typename Extractor, typename HashFunctions, typename Traits, typename KeyTraits>
	class HashTable;
	template<typename Key, typename Value, typename Extractor, typename HashFunctions, typename Traits, typename KeyTraits>
	class HashTableIterator;
	template<typename Key, typename Value, typename Extractor, typename HashFunctions, typename Traits, typename KeyTraits>
	class HashTableConstIterator;

	template<typename Key, typename Value, typename Extractor, typename HashFunctions, typename Traits, typename KeyTraits>
	void addIterator(const HashTable<Key, Value, Extractor, HashFunctions, Traits, KeyTraits>*,
		HashTableConstIterator<Key, Value, Extractor, HashFunctions, Traits, KeyTraits>*);

	template<typename Key, typename Value, typename Extractor, typename HashFunctions, typename Traits, typename KeyTraits>
	void removeIterator(HashTableConstIterator<Key, Value, Extractor, HashFunctions, Traits, KeyTraits>*);

#if !CHECK_HASHTABLE_ITERATORS

	template<typename Key, typename Value, typename Extractor, typename HashFunctions, typename Traits, typename KeyTraits>
	inline void addIterator(const HashTable<Key, Value, Extractor, HashFunctions, Traits, KeyTraits>*,
		HashTableConstIterator<Key, Value, Extractor, HashFunctions, Traits, KeyTraits>*) { }

	template<typename Key, typename Value, typename Extractor, typename HashFunctions, typename Traits, typename KeyTraits>
	inline void removeIterator(HashTableConstIterator<Key, Value, Extractor, HashFunctions, Traits, KeyTraits>*) { }

#endif

	typedef enum { HashItemKnownGood } HashItemKnownGoodTag;

	template<typename Key, typename Value, typename Extractor, typename HashFunctions, typename Traits, typename KeyTraits>
	class HashTableConstIterator : public std::iterator<std::forward_iterator_tag, Value, std::ptrdiff_t, const Value*, const Value&> {
	private:
		typedef HashTable<Key, Value, Extractor, HashFunctions, Traits, KeyTraits> HashTableType;
		typedef HashTableIterator<Key, Value, Extractor, HashFunctions, Traits, KeyTraits> iterator;
		typedef HashTableConstIterator<Key, Value, Extractor, HashFunctions, Traits, KeyTraits> const_iterator;
		typedef Value ValueType;
		typedef const ValueType& ReferenceType;
		typedef const ValueType* PointerType;

		friend class HashTable<Key, Value, Extractor, HashFunctions, Traits, KeyTraits>;
		friend class HashTableIterator<Key, Value, Extractor, HashFunctions, Traits, KeyTraits>;

		void skipEmptyBuckets()
		{
			while (m_position != m_endPosition && HashTableType::isEmptyOrDeletedBucket(*m_position))
				++m_position;
		}

		HashTableConstIterator(const HashTableType* table, PointerType position, PointerType endPosition)
			: m_position(position), m_endPosition(endPosition)
		{
			addIterator(table, this);
			skipEmptyBuckets();
		}

		HashTableConstIterator(const HashTableType* table, PointerType position, PointerType endPosition, HashItemKnownGoodTag)
			: m_position(position), m_endPosition(endPosition)
		{
			addIterator(table, this);
		}

	public:
		HashTableConstIterator()
		{
			addIterator(static_cast<const HashTableType*>(0), this);
		}

		// default copy, assignment and destructor are OK if CHECK_HASHTABLE_ITERATORS is 0

#if CHECK_HASHTABLE_ITERATORS
		~HashTableConstIterator()
		{
			removeIterator(this);
		}

		HashTableConstIterator(const const_iterator& other)
			: m_position(other.m_position), m_endPosition(other.m_endPosition)
		{
			addIterator(other.m_table, this);
		}

		const_iterator& operator=(const const_iterator& other)
		{
			m_position = other.m_position;
			m_endPosition = other.m_endPosition;

			removeIterator(this);
			addIterator(other.m_table, this);

			return *this;
		}
#endif

		PointerType get() const
		{
			checkValidity();
			return m_position;
		}
		ReferenceType operator*() const { return *get(); }
		PointerType operator->() const { return get(); }

		const_iterator& operator++()
		{
			checkValidity();
			ASSERT(m_position != m_endPosition);
			++m_position;
			skipEmptyBuckets();
			return *this;
		}

		// postfix ++ intentionally omitted

		// Comparison.
		bool operator==(const const_iterator& other) const
		{
			checkValidity(other);
			return m_position == other.m_position;
		}
		bool operator!=(const const_iterator& other) const
		{
			checkValidity(other);
			return m_position != other.m_position;
		}
		bool operator==(const iterator& other) const
		{
			return *this == static_cast<const_iterator>(other);
		}
		bool operator!=(const iterator& other) const
		{
			return *this != static_cast<const_iterator>(other);
		}

	private:
		void checkValidity() const
		{
#if CHECK_HASHTABLE_ITERATORS
			ASSERT(m_table);
#endif
		}


#if CHECK_HASHTABLE_ITERATORS
		void checkValidity(const const_iterator& other) const
		{
			ASSERT(m_table);
			ASSERT_UNUSED(other, other.m_table);
			ASSERT(m_table == other.m_table);
		}
#else
		void checkValidity(const const_iterator&) const { }
#endif

		PointerType m_position;
		PointerType m_endPosition;

#if CHECK_HASHTABLE_ITERATORS
	public:
		// Any modifications of the m_next or m_previous of an iterator that is in a linked list of a HashTable::m_iterator,
		// should be guarded with m_table->m_mutex.
		mutable const HashTableType* m_table;
		mutable const_iterator* m_next;
		mutable const_iterator* m_previous;
#endif
	};

	template<typename Key, typename Value, typename Extractor, typename HashFunctions, typename Traits, typename KeyTraits>
	class HashTableIterator : public std::iterator<std::forward_iterator_tag, Value, std::ptrdiff_t, Value*, Value&> {
	private:
		typedef HashTable<Key, Value, Extractor, HashFunctions, Traits, KeyTraits> HashTableType;
		typedef HashTableIterator<Key, Value, Extractor, HashFunctions, Traits, KeyTraits> iterator;
		typedef HashTableConstIterator<Key, Value, Extractor, HashFunctions, Traits, KeyTraits> const_iterator;
		typedef Value ValueType;
		typedef ValueType& ReferenceType;
		typedef ValueType* PointerType;

		friend class HashTable<Key, Value, Extractor, HashFunctions, Traits, KeyTraits>;

		HashTableIterator(HashTableType* table, PointerType pos, PointerType end) : m_iterator(table, pos, end) { }
		HashTableIterator(HashTableType* table, PointerType pos, PointerType end, HashItemKnownGoodTag tag) : m_iterator(table, pos, end, tag) { }

	public:
		HashTableIterator() { }

		// default copy, assignment and destructor are OK

		PointerType get() const { return const_cast<PointerType>(m_iterator.get()); }
		ReferenceType operator*() const { return *get(); }
		PointerType operator->() const { return get(); }

		iterator& operator++() { ++m_iterator; return *this; }

		// postfix ++ intentionally omitted

		// Comparison.
		bool operator==(const iterator& other) const { return m_iterator == other.m_iterator; }
		bool operator!=(const iterator& other) const { return m_iterator != other.m_iterator; }
		bool operator==(const const_iterator& other) const { return m_iterator == other; }
		bool operator!=(const const_iterator& other) const { return m_iterator != other; }

		operator const_iterator() const { return m_iterator; }

	private:
		const_iterator m_iterator;
	};

	template<typename ValueTraits, typename HashFunctions> class IdentityHashTranslator {
	public:
		template<typename T> static unsigned hash(const T& key) { return HashFunctions::hash(key); }
		template<typename T, typename U> static bool equal(const T& a, const U& b) { return HashFunctions::equal(a, b); }
		template<typename T, typename U, typename V> static void translate(T& location, const U&, V&& value)
		{
			ValueTraits::assignToEmpty(location, std::forward<V>(value));
		}
	};

	template<typename IteratorType> struct HashTableAddResult {
		HashTableAddResult() : isNewEntry(false) { }
		HashTableAddResult(IteratorType iter, bool isNewEntry) : iterator(iter), isNewEntry(isNewEntry) { }
		IteratorType iterator;
		bool isNewEntry;

		explicit operator bool() const { return isNewEntry; }
	};

	template<typename Key, typename Value, typename Extractor, typename HashFunctions, typename Traits, typename KeyTraits>
	class HashTable {
	public:
		typedef HashTableIterator<Key, Value, Extractor, HashFunctions, Traits, KeyTraits> iterator;
		typedef HashTableConstIterator<Key, Value, Extractor, HashFunctions, Traits, KeyTraits> const_iterator;
		typedef Traits ValueTraits;
		typedef Key KeyType;
		typedef Value ValueType;
		typedef IdentityHashTranslator<ValueTraits, HashFunctions> IdentityTranslatorType;
		typedef HashTableAddResult<iterator> AddResult;

#if DUMP_HASHTABLE_STATS_PER_TABLE
		struct Stats {
			Stats()
				: numAccesses(0)
				, numRehashes(0)
				, numRemoves(0)
				, numReinserts(0)
				, maxCollisions(0)
				, numCollisions(0)
				, collisionGraph()
			{
			}

			unsigned numAccesses;
			unsigned numRehashes;
			unsigned numRemoves;
			unsigned numReinserts;

			unsigned maxCollisions;
			unsigned numCollisions;
			unsigned collisionGraph[4096];

			void recordCollisionAtCount(unsigned count)
			{
				if (count > maxCollisions)
					maxCollisions = count;
				numCollisions++;
				collisionGraph[count]++;
			}

			void dumpStats()
			{
				dataLogF("\nWTF::HashTable::Stats dump\n\n");
				dataLogF("%d accesses\n", numAccesses);
				dataLogF("%d total collisions, average %.2f probes per access\n", numCollisions, 1.0 * (numAccesses + numCollisions) / numAccesses);
				dataLogF("longest collision chain: %d\n", maxCollisions);
				for (unsigned i = 1; i <= maxCollisions; i++) {
					dataLogF("  %d lookups with exactly %d collisions (%.2f%% , %.2f%% with this many or more)\n", collisionGraph[i], i, 100.0 * (collisionGraph[i] - collisionGraph[i + 1]) / numAccesses, 100.0 * collisionGraph[i] / numAccesses);
				}
				dataLogF("%d rehashes\n", numRehashes);
				dataLogF("%d reinserts\n", numReinserts);
			}
		};
#endif

		HashTable();
		~HashTable()
		{
			invalidateIterators();
			if (m_table)
				deallocateTable(m_table, m_tableSize);
#if CHECK_HASHTABLE_USE_AFTER_DESTRUCTION
			m_table = (ValueType*)(uintptr_t)0xbbadbeef;
#endif
		}

		HashTable(const HashTable&);
		void swap(HashTable&);
		HashTable& operator=(const HashTable&);

		HashTable(HashTable&&);
		HashTable& operator=(HashTable&&);

		// When the hash table is empty, just return the same iterator for end as for begin.
		// This is more efficient because we don't have to skip all the empty and deleted
		// buckets, and iterating an empty table is a common case that's worth optimizing.
		iterator begin() { return isEmpty() ? end() : makeIterator(m_table); }
		iterator end() { return makeKnownGoodIterator(m_table + m_tableSize); }
		const_iterator begin() const { return isEmpty() ? end() : makeConstIterator(m_table); }
		const_iterator end() const { return makeKnownGoodConstIterator(m_table + m_tableSize); }

		unsigned size() const { return m_keyCount; }
		unsigned capacity() const { return m_tableSize; }
		bool isEmpty() const { return !m_keyCount; }

		AddResult add(const ValueType& value) { return add<IdentityTranslatorType>(Extractor::extract(value), value); }
		AddResult add(ValueType&& value) { return add<IdentityTranslatorType>(Extractor::extract(value), WTFMove(value)); }

		// A special version of add() that finds the object by hashing and comparing
		// with some other type, to avoid the cost of type conversion if the object is already
		// in the table.
		template<typename HashTranslator, typename T, typename Extra> AddResult add(T&& key, Extra&&);
		template<typename HashTranslator, typename T, typename Extra> AddResult addPassingHashCode(T&& key, Extra&&);

		iterator find(const KeyType& key) { return find<IdentityTranslatorType>(key); }
		const_iterator find(const KeyType& key) const { return find<IdentityTranslatorType>(key); }
		bool contains(const KeyType& key) const { return contains<IdentityTranslatorType>(key); }

		template<typename HashTranslator, typename T> iterator find(const T&);
		template<typename HashTranslator, typename T> const_iterator find(const T&) const;
		template<typename HashTranslator, typename T> bool contains(const T&) const;

		void remove(const KeyType&);
		void remove(iterator);
		void removeWithoutEntryConsistencyCheck(iterator);
		void removeWithoutEntryConsistencyCheck(const_iterator);
		template<typename Functor>
		void removeIf(const Functor&);
		void clear();

		static bool isEmptyBucket(const ValueType& value) { return isHashTraitsEmptyValue<KeyTraits>(Extractor::extract(value)); }
		static bool isDeletedBucket(const ValueType& value) { return KeyTraits::isDeletedValue(Extractor::extract(value)); }
		static bool isEmptyOrDeletedBucket(const ValueType& value) { return isEmptyBucket(value) || isDeletedBucket(value); }

		ValueType* lookup(const Key& key) { return lookup<IdentityTranslatorType>(key); }
		template<typename HashTranslator, typename T> ValueType* lookup(const T&);
		template<typename HashTranslator, typename T> ValueType* inlineLookup(const T&);

#if !ASSERT_DISABLED
		void checkTableConsistency() const;
#else
		static void checkTableConsistency() { }
#endif
#if CHECK_HASHTABLE_CONSISTENCY
		void internalCheckTableConsistency() const { checkTableConsistency(); }
		void internalCheckTableConsistencyExceptSize() const { checkTableConsistencyExceptSize(); }
#else
		static void internalCheckTableConsistencyExceptSize() { }
		static void internalCheckTableConsistency() { }
#endif

	private:
		static ValueType* allocateTable(unsigned size);
		static void deallocateTable(ValueType* table, unsigned size);

		typedef std::pair<ValueType*, bool> LookupType;
		typedef std::pair<LookupType, unsigned> FullLookupType;

		LookupType lookupForWriting(const Key& key) { return lookupForWriting<IdentityTranslatorType>(key); };
		template<typename HashTranslator, typename T> FullLookupType fullLookupForWriting(const T&);
		template<typename HashTranslator, typename T> LookupType lookupForWriting(const T&);

		template<typename HashTranslator, typename T, typename Extra> void addUniqueForInitialization(T&& key, Extra&&);

		template<typename HashTranslator, typename T> void checkKey(const T&);

		void removeAndInvalidateWithoutEntryConsistencyCheck(ValueType*);
		void removeAndInvalidate(ValueType*);
		void remove(ValueType*);

		bool shouldExpand() const { return (m_keyCount + m_deletedCount) * m_maxLoad >= m_tableSize; }
		bool mustRehashInPlace() const { return m_keyCount * m_minLoad < m_tableSize * 2; }
		bool shouldShrink() const {return false; return m_keyCount * m_minLoad < m_tableSize&& m_tableSize > KeyTraits::minimumTableSize; }
		ValueType* expand(ValueType* entry = nullptr);
		void shrink() { rehash(m_tableSize / 2, nullptr); }

		ValueType* rehash(unsigned newTableSize, ValueType* entry);
		ValueType* reinsert(ValueType&&);

		static void initializeBucket(ValueType& bucket);
		static void deleteBucket(ValueType& bucket) { hashTraitsDeleteBucket<Traits>(bucket); }

		FullLookupType makeLookupResult(ValueType* position, bool found, unsigned hash)
		{
			return FullLookupType(LookupType(position, found), hash);
		}

		iterator makeIterator(ValueType* pos) { return iterator(this, pos, m_table + m_tableSize); }
		const_iterator makeConstIterator(ValueType* pos) const { return const_iterator(this, pos, m_table + m_tableSize); }
		iterator makeKnownGoodIterator(ValueType* pos) { return iterator(this, pos, m_table + m_tableSize, HashItemKnownGood); }
		const_iterator makeKnownGoodConstIterator(ValueType* pos) const { return const_iterator(this, pos, m_table + m_tableSize, HashItemKnownGood); }

#if !ASSERT_DISABLED
		void checkTableConsistencyExceptSize() const;
#else
		static void checkTableConsistencyExceptSize() { }
#endif

#if CHECK_HASHTABLE_ITERATORS
		void invalidateIterators();
#else
		static void invalidateIterators() { }
#endif

		static const unsigned m_maxLoad = 2;
		static const unsigned m_minLoad = 6;

		ValueType* m_table;
		unsigned m_tableSize;
		unsigned m_tableSizeMask;
		unsigned m_keyCount;
		unsigned m_deletedCount;

#if CHECK_HASHTABLE_ITERATORS
	public:
		// All access to m_iterators should be guarded with m_mutex.
		mutable const_iterator* m_iterators;
		// Use std::unique_ptr so HashTable can still be memmove'd or memcpy'ed.
		mutable std::unique_ptr<Lock> m_mutex;
#endif

#if DUMP_HASHTABLE_STATS_PER_TABLE
	public:
		mutable std::unique_ptr<Stats> m_stats;
#endif
	};

	// Set all the bits to one after the most significant bit: 00110101010 -> 00111111111.
	template<unsigned size> struct OneifyLowBits;
	template<>
	struct OneifyLowBits<0> {
		static const unsigned value = 0;
	};
	template<unsigned number>
	struct OneifyLowBits {
		static const unsigned value = number | OneifyLowBits<(number >> 1)>::value;
	};
	// Compute the first power of two integer that is an upper bound of the parameter 'number'.
	template<unsigned number>
	struct UpperPowerOfTwoBound {
		static const unsigned value = (OneifyLowBits<number - 1>::value + 1) * 2;
	};

	// Because power of two numbers are the limit of maxLoad, their capacity is twice the
	// UpperPowerOfTwoBound, or 4 times their values.
	template<unsigned size, bool isPowerOfTwo> struct HashTableCapacityForSizeSplitter;
	template<unsigned size>
	struct HashTableCapacityForSizeSplitter<size, true> {
		static const unsigned value = size * 4;
	};
	template<unsigned size>
	struct HashTableCapacityForSizeSplitter<size, false> {
		static const unsigned value = UpperPowerOfTwoBound<size>::value;
	};

	// HashTableCapacityForSize computes the upper power of two capacity to hold the size parameter.
	// This is done at compile time to initialize the HashTraits.
	template<unsigned size>
	struct HashTableCapacityForSize {
		static const unsigned value = HashTableCapacityForSizeSplitter<size, !(size& (size - 1))>::value;
	};

	template<typename Key, typename Value, typename Extractor, typename HashFunctions, typename Traits, typename KeyTraits>
	inline HashTable<Key, Value, Extractor, HashFunctions, Traits, KeyTraits>::HashTable()
		: m_table(0)
		, m_tableSize(0)
		, m_tableSizeMask(0)
		, m_keyCount(0)
		, m_deletedCount(0)
#if CHECK_HASHTABLE_ITERATORS
		, m_iterators(0)
		, m_mutex(std::make_unique<Lock>())
#endif
#if DUMP_HASHTABLE_STATS_PER_TABLE
		, m_stats(std::make_unique<Stats>())
#endif
	{
	}

	inline unsigned doubleHash(unsigned key)
	{
		key = ~key + (key >> 23);
		key ^= (key << 12);
		key ^= (key >> 7);
		key ^= (key << 2);
		key ^= (key >> 20);
		return key;
	}

#if ASSERT_DISABLED

	template<typename Key, typename Value, typename Extractor, typename HashFunctions, typename Traits, typename KeyTraits>
	template<typename HashTranslator, typename T>
	inline void HashTable<Key, Value, Extractor, HashFunctions, Traits, KeyTraits>::checkKey(const T&)
	{
	}

#else

	template<typename Key, typename Value, typename Extractor, typename HashFunctions, typename Traits, typename KeyTraits>
	template<typename HashTranslator, typename T>
	void HashTable<Key, Value, Extractor, HashFunctions, Traits, KeyTraits>::checkKey(const T& key)
	{
		if (!HashFunctions::safeToCompareToEmptyOrDeleted)
			return;
		ASSERT(!HashTranslator::equal(KeyTraits::emptyValue(), key));
		typename std::aligned_storage<sizeof(ValueType), std::alignment_of<ValueType>::value>::type deletedValueBuffer;
		ValueType* deletedValuePtr = reinterpret_cast_ptr<ValueType*>(&deletedValueBuffer);
		ValueType& deletedValue = *deletedValuePtr;
		Traits::constructDeletedValue(deletedValue);
		ASSERT(!HashTranslator::equal(Extractor::extract(deletedValue), key));
	}

#endif

	template<typename Key, typename Value, typename Extractor, typename HashFunctions, typename Traits, typename KeyTraits>
	template<typename HashTranslator, typename T>
	inline auto HashTable<Key, Value, Extractor, HashFunctions, Traits, KeyTraits>::lookup(const T& key) -> ValueType*
	{
		return inlineLookup<HashTranslator>(key);
	}

	template<typename Key, typename Value, typename Extractor, typename HashFunctions, typename Traits, typename KeyTraits>
	template<typename HashTranslator, typename T>
	ALWAYS_INLINE auto HashTable<Key, Value, Extractor, HashFunctions, Traits, KeyTraits>::inlineLookup(const T& key) -> ValueType*
	{
		checkKey<HashTranslator>(key);

		unsigned k = 0;
		unsigned sizeMask = m_tableSizeMask;
		ValueType* table = m_table;
		unsigned h = HashTranslator::hash(key);
		unsigned i = h & sizeMask;

		if (!table)
			return 0;

#if DUMP_HASHTABLE_STATS
		++HashTableStats::numAccesses;
		unsigned probeCount = 0;
#endif

#if DUMP_HASHTABLE_STATS_PER_TABLE
		++m_stats->numAccesses;
#endif

		while (1) {
			ValueType* entry = table + i;

			// we count on the compiler to optimize out this branch
			if (HashFunctions::safeToCompareToEmptyOrDeleted) {
				if (HashTranslator::equal(Extractor::extract(*entry), key))
					return entry;

				if (isEmptyBucket(*entry))
					return 0;
			}
			else {
				if (isEmptyBucket(*entry))
					return 0;

				if (!isDeletedBucket(*entry) && HashTranslator::equal(Extractor::extract(*entry), key))
					return entry;
			}
#if DUMP_HASHTABLE_STATS
			++probeCount;
			HashTableStats::recordCollisionAtCount(probeCount);
#endif

#if DUMP_HASHTABLE_STATS_PER_TABLE
			m_stats->recordCollisionAtCount(probeCount);
#endif



			k+=1;
			i = (i + k) & sizeMask;
		}
	}

	template<typename Key, typename Value, typename Extractor, typename HashFunctions, typename Traits, typename KeyTraits>
	template<typename HashTranslator, typename T>
	inline auto HashTable<Key, Value, Extractor, HashFunctions, Traits, KeyTraits>::lookupForWriting(const T& key) -> LookupType
	{
		ASSERT(m_table);
		checkKey<HashTranslator>(key);

		unsigned k = 0;
		ValueType* table = m_table;
		unsigned sizeMask = m_tableSizeMask;
		unsigned h = HashTranslator::hash(key);
		unsigned i = h & sizeMask;

#if DUMP_HASHTABLE_STATS
		++HashTableStats::numAccesses;
		unsigned probeCount = 0;
#endif

#if DUMP_HASHTABLE_STATS_PER_TABLE
		++m_stats->numAccesses;
#endif

		ValueType* deletedEntry = 0;

		while (1) {
			ValueType* entry = table + i;
			if (isEmptyBucket(*entry))
				return LookupType(deletedEntry ? deletedEntry : entry, false);
			// we count on the compiler to optimize out this branch
			if (HashFunctions::safeToCompareToEmptyOrDeleted) {
				if (isEmptyBucket(*entry))
					return LookupType(deletedEntry ? deletedEntry : entry, false);

				if (HashTranslator::equal(Extractor::extract(*entry), key))
					return LookupType(entry, true);

				if (isDeletedBucket(*entry))
					deletedEntry = entry;
			}
			else {
				if (isEmptyBucket(*entry))
					return LookupType(deletedEntry ? deletedEntry : entry, false);

				if (isDeletedBucket(*entry))
					deletedEntry = entry;
				else if (HashTranslator::equal(Extractor::extract(*entry), key))
					return LookupType(entry, true);
			}
#if DUMP_HASHTABLE_STATS
			++probeCount;
			HashTableStats::recordCollisionAtCount(probeCount);
#endif

#if DUMP_HASHTABLE_STATS_PER_TABLE
			m_stats->recordCollisionAtCount(probeCount);
#endif



			k+=1;
			i = (i + k) & sizeMask;
		}
	}

	template<typename Key, typename Value, typename Extractor, typename HashFunctions, typename Traits, typename KeyTraits>
	template<typename HashTranslator, typename T>
	inline auto HashTable<Key, Value, Extractor, HashFunctions, Traits, KeyTraits>::fullLookupForWriting(const T& key) -> FullLookupType
	{
		ASSERT(m_table);
		checkKey<HashTranslator>(key);

		unsigned k = 0;
		ValueType* table = m_table;
		unsigned sizeMask = m_tableSizeMask;
		unsigned h = HashTranslator::hash(key);
		unsigned i = h & sizeMask;

#if DUMP_HASHTABLE_STATS
		++HashTableStats::numAccesses;
		unsigned probeCount = 0;
#endif

#if DUMP_HASHTABLE_STATS_PER_TABLE
		++m_stats->numAccesses;
#endif

		ValueType* deletedEntry = 0;

		while (1) {
			ValueType* entry = table + i;

			// we count on the compiler to optimize out this branch
			if (HashFunctions::safeToCompareToEmptyOrDeleted) {
				if (isEmptyBucket(*entry))
					return makeLookupResult(deletedEntry ? deletedEntry : entry, false, h);

				if (HashTranslator::equal(Extractor::extract(*entry), key))
					return makeLookupResult(entry, true, h);

				if (isDeletedBucket(*entry))
					deletedEntry = entry;
			}
			else {
				if (isEmptyBucket(*entry))
					return makeLookupResult(deletedEntry ? deletedEntry : entry, false, h);

				if (isDeletedBucket(*entry))
					deletedEntry = entry;
				else if (HashTranslator::equal(Extractor::extract(*entry), key))
					return makeLookupResult(entry, true, h);
			}
#if DUMP_HASHTABLE_STATS
			++probeCount;
			HashTableStats::recordCollisionAtCount(probeCount);
#endif

#if DUMP_HASHTABLE_STATS_PER_TABLE
			m_stats->recordCollisionAtCount(probeCount);
#endif



			k+=1;
			i = (i + k) & sizeMask;
		}
	}

	template<typename Key, typename Value, typename Extractor, typename HashFunctions, typename Traits, typename KeyTraits>
	template<typename HashTranslator, typename T, typename Extra>
	ALWAYS_INLINE void HashTable<Key, Value, Extractor, HashFunctions, Traits, KeyTraits>::addUniqueForInitialization(T&& key, Extra&& extra)
	{
		ASSERT(m_table);

		checkKey<HashTranslator>(key);

		invalidateIterators();

		internalCheckTableConsistency();

		unsigned k = 0;
		ValueType* table = m_table;
		unsigned sizeMask = m_tableSizeMask;
		unsigned h = HashTranslator::hash(key);
		unsigned i = h & sizeMask;

#if DUMP_HASHTABLE_STATS
		++HashTableStats::numAccesses;
		unsigned probeCount = 0;
#endif

#if DUMP_HASHTABLE_STATS_PER_TABLE
		++m_stats->numAccesses;
#endif

		ValueType* entry;
		while (1) {
			entry = table + i;

			if (isEmptyBucket(*entry))
				break;

#if DUMP_HASHTABLE_STATS
			++probeCount;
			HashTableStats::recordCollisionAtCount(probeCount);
#endif

#if DUMP_HASHTABLE_STATS_PER_TABLE
			m_stats->recordCollisionAtCount(probeCount);
#endif



			k+=1;
			i = (i + k) & sizeMask;
		}

		HashTranslator::translate(*entry, std::forward<T>(key), std::forward<Extra>(extra));

		internalCheckTableConsistency();
	}

	template<bool emptyValueIsZero> struct HashTableBucketInitializer;

	template<> struct HashTableBucketInitializer<false> {
		template<typename Traits, typename Value> static void initialize(Value& bucket)
		{
			new (WTF_NONULL::NotNull, std::addressof(bucket)) Value(Traits::emptyValue());
		}
	};

	template<> struct HashTableBucketInitializer<true> {
		template<typename Traits, typename Value> static void initialize(Value& bucket)
		{
			// This initializes the bucket without copying the empty value.
			// That makes it possible to use this with types that don't support copying.
			// The memset to 0 looks like a slow operation but is optimized by the compilers.
			memset(std::addressof(bucket), 0, sizeof(bucket));
		}
	};

	template<typename Key, typename Value, typename Extractor, typename HashFunctions, typename Traits, typename KeyTraits>
	inline void HashTable<Key, Value, Extractor, HashFunctions, Traits, KeyTraits>::initializeBucket(ValueType& bucket)
	{
		HashTableBucketInitializer<Traits::emptyValueIsZero>::template initialize<Traits>(bucket);
	}

	template<typename Key, typename Value, typename Extractor, typename HashFunctions, typename Traits, typename KeyTraits>
	template<typename HashTranslator, typename T, typename Extra>
	ALWAYS_INLINE auto HashTable<Key, Value, Extractor, HashFunctions, Traits, KeyTraits>::add(T&& key, Extra&& extra) -> AddResult
	{
		checkKey<HashTranslator>(key);

		invalidateIterators();

		if (!m_table)
			expand(nullptr);

		internalCheckTableConsistency();

		ASSERT(m_table);

		unsigned k = 0;
		ValueType* table = m_table;
		unsigned sizeMask = m_tableSizeMask;
		unsigned h = HashTranslator::hash(key);
		unsigned i = h & sizeMask;

#if DUMP_HASHTABLE_STATS
		++HashTableStats::numAccesses;
		unsigned probeCount = 0;
#endif

#if DUMP_HASHTABLE_STATS_PER_TABLE
		++m_stats->numAccesses;
#endif

		ValueType* deletedEntry = 0;
		ValueType* entry;
		while (1) {
			entry = table + i;

			// we count on the compiler to optimize out this branch
			if (HashFunctions::safeToCompareToEmptyOrDeleted) {
				if (isEmptyBucket(*entry))
					break;

				if (HashTranslator::equal(Extractor::extract(*entry), key))
					return AddResult(makeKnownGoodIterator(entry), false);

				if (isDeletedBucket(*entry))
					deletedEntry = entry;
			}
			else {
				if (isEmptyBucket(*entry))
					break;

				if (isDeletedBucket(*entry))
					deletedEntry = entry;
				else if (HashTranslator::equal(Extractor::extract(*entry), key))
					return AddResult(makeKnownGoodIterator(entry), false);
			}
#if DUMP_HASHTABLE_STATS
			++probeCount;
			HashTableStats::recordCollisionAtCount(probeCount);
#endif

#if DUMP_HASHTABLE_STATS_PER_TABLE
			m_stats->recordCollisionAtCount(probeCount);
#endif



			k+=1;
			i = (i + k) & sizeMask;
		}

		if (deletedEntry) {
			initializeBucket(*deletedEntry);
			entry = deletedEntry;
			--m_deletedCount;
		}

		HashTranslator::translate(*entry, std::forward<T>(key), std::forward<Extra>(extra));
		++m_keyCount;

		if (shouldExpand())
			entry = expand(entry);

		internalCheckTableConsistency();

		return AddResult(makeKnownGoodIterator(entry), true);
	}

	template<typename Key, typename Value, typename Extractor, typename HashFunctions, typename Traits, typename KeyTraits>
	template<typename HashTranslator, typename T, typename Extra>
	inline auto HashTable<Key, Value, Extractor, HashFunctions, Traits, KeyTraits>::addPassingHashCode(T&& key, Extra&& extra) -> AddResult
	{
		checkKey<HashTranslator>(key);

		invalidateIterators();

		if (!m_table)
			expand();

		internalCheckTableConsistency();

		FullLookupType lookupResult = fullLookupForWriting<HashTranslator>(key);

		ValueType* entry = lookupResult.first.first;
		bool found = lookupResult.first.second;
		unsigned h = lookupResult.second;

		if (found)
			return AddResult(makeKnownGoodIterator(entry), false);

		if (isDeletedBucket(*entry)) {
			initializeBucket(*entry);
			--m_deletedCount;
		}

		HashTranslator::translate(*entry, std::forward<T>(key), std::forward<Extra>(extra), h);
		++m_keyCount;

		if (shouldExpand())
			entry = expand(entry);

		internalCheckTableConsistency();

		return AddResult(makeKnownGoodIterator(entry), true);
	}

	template<typename Key, typename Value, typename Extractor, typename HashFunctions, typename Traits, typename KeyTraits>
	inline auto HashTable<Key, Value, Extractor, HashFunctions, Traits, KeyTraits>::reinsert(ValueType&& entry) -> ValueType*
	{
		ASSERT(m_table);
		ASSERT(!lookupForWriting(Extractor::extract(entry)).second);
		ASSERT(!isDeletedBucket(*(lookupForWriting(Extractor::extract(entry)).first)));
#if DUMP_HASHTABLE_STATS
		++HashTableStats::numReinserts;
#endif
#if DUMP_HASHTABLE_STATS_PER_TABLE
		++m_stats->numReinserts;
#endif

		Value* newEntry = lookupForWriting(Extractor::extract(entry)).first;
		newEntry->~Value();
		new (WTF_NONULL::NotNull, newEntry) ValueType(WTFMove(entry));

		return newEntry;
	}

	template<typename Key, typename Value, typename Extractor, typename HashFunctions, typename Traits, typename KeyTraits>
	template <typename HashTranslator, typename T>
	auto HashTable<Key, Value, Extractor, HashFunctions, Traits, KeyTraits>::find(const T& key) -> iterator
	{
		if (!m_table)
			return end();

		ValueType* entry = lookup<HashTranslator>(key);
		if (!entry)
			return end();

		return makeKnownGoodIterator(entry);
	}

	template<typename Key, typename Value, typename Extractor, typename HashFunctions, typename Traits, typename KeyTraits>
	template <typename HashTranslator, typename T>
	auto HashTable<Key, Value, Extractor, HashFunctions, Traits, KeyTraits>::find(const T& key) const -> const_iterator
	{
		if (!m_table)
			return end();

		ValueType* entry = const_cast<HashTable*>(this)->lookup<HashTranslator>(key);
		if (!entry)
			return end();

		return makeKnownGoodConstIterator(entry);
	}

	template<typename Key, typename Value, typename Extractor, typename HashFunctions, typename Traits, typename KeyTraits>
	template <typename HashTranslator, typename T>
	bool HashTable<Key, Value, Extractor, HashFunctions, Traits, KeyTraits>::contains(const T& key) const
	{
		if (!m_table)
			return false;

		return const_cast<HashTable*>(this)->lookup<HashTranslator>(key);
	}

	template<typename Key, typename Value, typename Extractor, typename HashFunctions, typename Traits, typename KeyTraits>
	void HashTable<Key, Value, Extractor, HashFunctions, Traits, KeyTraits>::removeAndInvalidateWithoutEntryConsistencyCheck(ValueType* pos)
	{
		invalidateIterators();
		remove(pos);
	}

	template<typename Key, typename Value, typename Extractor, typename HashFunctions, typename Traits, typename KeyTraits>
	void HashTable<Key, Value, Extractor, HashFunctions, Traits, KeyTraits>::removeAndInvalidate(ValueType* pos)
	{
		invalidateIterators();
		internalCheckTableConsistency();
		remove(pos);
	}

	template<typename Key, typename Value, typename Extractor, typename HashFunctions, typename Traits, typename KeyTraits>
	void HashTable<Key, Value, Extractor, HashFunctions, Traits, KeyTraits>::remove(ValueType* pos)
	{
#if DUMP_HASHTABLE_STATS
		++HashTableStats::numRemoves;
#endif
#if DUMP_HASHTABLE_STATS_PER_TABLE
		++m_stats->numRemoves;
#endif

		deleteBucket(*pos);
		++m_deletedCount;
		--m_keyCount;

		if (shouldShrink())
			shrink();

		internalCheckTableConsistency();
	}

	template<typename Key, typename Value, typename Extractor, typename HashFunctions, typename Traits, typename KeyTraits>
	inline void HashTable<Key, Value, Extractor, HashFunctions, Traits, KeyTraits>::remove(iterator it)
	{
		if (it == end())
			return;

		removeAndInvalidate(const_cast<ValueType*>(it.m_iterator.m_position));
	}

	template<typename Key, typename Value, typename Extractor, typename HashFunctions, typename Traits, typename KeyTraits>
	inline void HashTable<Key, Value, Extractor, HashFunctions, Traits, KeyTraits>::removeWithoutEntryConsistencyCheck(iterator it)
	{
		if (it == end())
			return;

		removeAndInvalidateWithoutEntryConsistencyCheck(const_cast<ValueType*>(it.m_iterator.m_position));
	}

	template<typename Key, typename Value, typename Extractor, typename HashFunctions, typename Traits, typename KeyTraits>
	inline void HashTable<Key, Value, Extractor, HashFunctions, Traits, KeyTraits>::removeWithoutEntryConsistencyCheck(const_iterator it)
	{
		if (it == end())
			return;

		removeAndInvalidateWithoutEntryConsistencyCheck(const_cast<ValueType*>(it.m_position));
	}

	template<typename Key, typename Value, typename Extractor, typename HashFunctions, typename Traits, typename KeyTraits>
	inline void HashTable<Key, Value, Extractor, HashFunctions, Traits, KeyTraits>::remove(const KeyType& key)
	{
		remove(find(key));
	}

	template<typename Key, typename Value, typename Extractor, typename HashFunctions, typename Traits, typename KeyTraits>
	template<typename Functor>
	inline void HashTable<Key, Value, Extractor, HashFunctions, Traits, KeyTraits>::removeIf(const Functor& functor)
	{
		// We must use local copies in case "functor" or "deleteBucket"
		// make a function call, which prevents the compiler from keeping
		// the values in register.
		unsigned removedBucketCount = 0;
		ValueType* table = m_table;

		for (unsigned i = m_tableSize; i--;) {
			ValueType& bucket = table[i];
			if (isEmptyOrDeletedBucket(bucket))
				continue;

			if (!functor(bucket))
				continue;

			deleteBucket(bucket);
			++removedBucketCount;
		}
		m_deletedCount += removedBucketCount;
		m_keyCount -= removedBucketCount;

		if (shouldShrink())
			shrink();

		internalCheckTableConsistency();
	}

	template<typename Key, typename Value, typename Extractor, typename HashFunctions, typename Traits, typename KeyTraits>
	auto HashTable<Key, Value, Extractor, HashFunctions, Traits, KeyTraits>::allocateTable(unsigned size) -> ValueType*
	{
		// would use a template member function with explicit specializations here, but
		// gcc doesn't appear to support that
		if (Traits::emptyValueIsZero)
			return static_cast<ValueType*>(calloc(size, sizeof(ValueType)));
		ValueType* result = static_cast<ValueType*>(calloc(size, sizeof(ValueType)));
		for (unsigned i = 0; i < size; i++)
			initializeBucket(result[i]);
		return result;
	}

	template<typename Key, typename Value, typename Extractor, typename HashFunctions, typename Traits, typename KeyTraits>
	void HashTable<Key, Value, Extractor, HashFunctions, Traits, KeyTraits>::deallocateTable(ValueType* table, unsigned size)
	{
		for (unsigned i = 0; i < size; ++i) {
			if (!isDeletedBucket(table[i]))
				table[i].~ValueType();
		}
		free(table);
	}

	template<typename Key, typename Value, typename Extractor, typename HashFunctions, typename Traits, typename KeyTraits>
	auto HashTable<Key, Value, Extractor, HashFunctions, Traits, KeyTraits>::expand(ValueType* entry) -> ValueType*
	{
		unsigned newSize;
		if (m_tableSize == 0)
			newSize = KeyTraits::minimumTableSize;
		else if (mustRehashInPlace())
			newSize = m_tableSize;
		else
			newSize = m_tableSize * 2;

		return rehash(newSize, entry);
	}

	template<typename Key, typename Value, typename Extractor, typename HashFunctions, typename Traits, typename KeyTraits>
	auto HashTable<Key, Value, Extractor, HashFunctions, Traits, KeyTraits>::rehash(unsigned newTableSize, ValueType* entry) -> ValueType*
	{
		internalCheckTableConsistencyExceptSize();

		unsigned oldTableSize = m_tableSize;
		ValueType* oldTable = m_table;

#if DUMP_HASHTABLE_STATS
		if (oldTableSize != 0)
			++HashTableStats::numRehashes;
#endif

#if DUMP_HASHTABLE_STATS_PER_TABLE
		if (oldTableSize != 0)
			++m_stats->numRehashes;
#endif
		m_tableSize = newTableSize;
		m_tableSizeMask = newTableSize - 1;
		m_table = allocateTable(newTableSize);

		Value* newEntry = nullptr;
		for (unsigned i = 0; i != oldTableSize; ++i) {
			if (isDeletedBucket(oldTable[i])) {
				ASSERT(std::addressof(oldTable[i]) != entry);
				continue;
			}

			if (isEmptyBucket(oldTable[i])) {
				ASSERT(std::addressof(oldTable[i]) != entry);
				oldTable[i].~ValueType();
				continue;
			}

			Value* reinsertedEntry = reinsert(WTFMove(oldTable[i]));
			oldTable[i].~ValueType();
			if (std::addressof(oldTable[i]) == entry) {
				ASSERT(!newEntry);
				newEntry = reinsertedEntry;
			}
		}

		m_deletedCount = 0;

		free(oldTable);

		internalCheckTableConsistency();
		return newEntry;
	}

	template<typename Key, typename Value, typename Extractor, typename HashFunctions, typename Traits, typename KeyTraits>
	void HashTable<Key, Value, Extractor, HashFunctions, Traits, KeyTraits>::clear()
	{
		invalidateIterators();
		if (!m_table)
			return;

		deallocateTable(m_table, m_tableSize);
		m_table = 0;
		m_tableSize = 0;
		m_tableSizeMask = 0;
		m_keyCount = 0;
		m_deletedCount = 0;
	}

	template<typename Key, typename Value, typename Extractor, typename HashFunctions, typename Traits, typename KeyTraits>
	HashTable<Key, Value, Extractor, HashFunctions, Traits, KeyTraits>::HashTable(const HashTable& other)
		: m_table(nullptr)
		, m_tableSize(0)
		, m_tableSizeMask(0)
		, m_keyCount(0)
		, m_deletedCount(0)
#if CHECK_HASHTABLE_ITERATORS
		, m_iterators(nullptr)
		, m_mutex(std::make_unique<Lock>())
#endif
#if DUMP_HASHTABLE_STATS_PER_TABLE
		, m_stats(std::make_unique<Stats>(*other.m_stats))
#endif
	{
		unsigned otherKeyCount = other.size();
		if (!otherKeyCount)
			return;

		unsigned bestTableSize = CalculateCapacity(otherKeyCount); //WTF::roundUpToPowerOfTwo(otherKeyCount) * 2;

		// With maxLoad at 1/2 and minLoad at 1/6, our average load is 2/6.
		// If we are getting halfway between 2/6 and 1/2 (past 5/12), we double the size to avoid being too close to
		// loadMax and bring the ratio close to 2/6. This give us a load in the bounds [3/12, 5/12).
		/*bool aboveThreeQuarterLoad = otherKeyCount * 12 >= bestTableSize * 5;
		if (aboveThreeQuarterLoad)
			bestTableSize *= 2;*/

		unsigned minimumTableSize = KeyTraits::minimumTableSize;
		m_tableSize = std::max<unsigned>(bestTableSize, minimumTableSize);
		m_tableSizeMask = m_tableSize - 1;
		m_table = allocateTable(m_tableSize);

		for (const auto& otherValue : other)
			add<IdentityTranslatorType>(Extractor::extract(otherValue), otherValue);
	}

	template<typename Key, typename Value, typename Extractor, typename HashFunctions, typename Traits, typename KeyTraits>
	void HashTable<Key, Value, Extractor, HashFunctions, Traits, KeyTraits>::swap(HashTable& other)
	{
		invalidateIterators();
		other.invalidateIterators();

		std::swap(m_table, other.m_table);
		std::swap(m_tableSize, other.m_tableSize);
		std::swap(m_tableSizeMask, other.m_tableSizeMask);
		std::swap(m_keyCount, other.m_keyCount);
		std::swap(m_deletedCount, other.m_deletedCount);

#if DUMP_HASHTABLE_STATS_PER_TABLE
		m_stats.swap(other.m_stats);
#endif
	}

	template<typename Key, typename Value, typename Extractor, typename HashFunctions, typename Traits, typename KeyTraits>
	auto HashTable<Key, Value, Extractor, HashFunctions, Traits, KeyTraits>::operator=(const HashTable& other) -> HashTable&
	{
		HashTable tmp(other);
		swap(tmp);
		return *this;
	}

	template<typename Key, typename Value, typename Extractor, typename HashFunctions, typename Traits, typename KeyTraits>
	inline HashTable<Key, Value, Extractor, HashFunctions, Traits, KeyTraits>::HashTable(HashTable&& other)
#if CHECK_HASHTABLE_ITERATORS
		: m_iterators(nullptr)
		, m_mutex(std::make_unique<Lock>())
#endif
	{
		other.invalidateIterators();

		m_table = other.m_table;
		m_tableSize = other.m_tableSize;
		m_tableSizeMask = other.m_tableSizeMask;
		m_keyCount = other.m_keyCount;
		m_deletedCount = other.m_deletedCount;

		other.m_table = nullptr;
		other.m_tableSize = 0;
		other.m_tableSizeMask = 0;
		other.m_keyCount = 0;
		other.m_deletedCount = 0;

#if DUMP_HASHTABLE_STATS_PER_TABLE
		m_stats = WTFMove(other.m_stats);
		other.m_stats = nullptr;
#endif
	}

	template<typename Key, typename Value, typename Extractor, typename HashFunctions, typename Traits, typename KeyTraits>
	inline auto HashTable<Key, Value, Extractor, HashFunctions, Traits, KeyTraits>::operator=(HashTable&& other) -> HashTable&
	{
		HashTable temp = WTFMove(other);
		swap(temp);
		return *this;
	}

#if !ASSERT_DISABLED

	template<typename Key, typename Value, typename Extractor, typename HashFunctions, typename Traits, typename KeyTraits>
	void HashTable<Key, Value, Extractor, HashFunctions, Traits, KeyTraits>::checkTableConsistency() const
	{
		checkTableConsistencyExceptSize();
		ASSERT(!m_table || !shouldExpand());
		ASSERT(!shouldShrink());
	}

	template<typename Key, typename Value, typename Extractor, typename HashFunctions, typename Traits, typename KeyTraits>
	void HashTable<Key, Value, Extractor, HashFunctions, Traits, KeyTraits>::checkTableConsistencyExceptSize() const
	{
		if (!m_table)
			return;

		unsigned count = 0;
		unsigned deletedCount = 0;
		for (unsigned j = 0; j < m_tableSize; ++j) {
			ValueType* entry = m_table + j;
			if (isEmptyBucket(*entry))
				continue;

			if (isDeletedBucket(*entry)) {
				++deletedCount;
				continue;
			}

			const_iterator it = find(Extractor::extract(*entry));
			ASSERT(entry == it.m_position);
			++count;

			ValueCheck<Key>::checkConsistency(it->key);
		}

		ASSERT(count == m_keyCount);
		ASSERT(deletedCount == m_deletedCount);
		ASSERT(m_tableSize >= KeyTraits::minimumTableSize);
		ASSERT(m_tableSizeMask);
		ASSERT(m_tableSize == m_tableSizeMask + 1);
	}

#endif // ASSERT_DISABLED

#if CHECK_HASHTABLE_ITERATORS

	template<typename Key, typename Value, typename Extractor, typename HashFunctions, typename Traits, typename KeyTraits>
	void HashTable<Key, Value, Extractor, HashFunctions, Traits, KeyTraits>::invalidateIterators()
	{
		std::lock_guard<Lock> lock(*m_mutex);
		const_iterator* next;
		for (const_iterator* p = m_iterators; p; p = next) {
			next = p->m_next;
			p->m_table = 0;
			p->m_next = 0;
			p->m_previous = 0;
		}
		m_iterators = 0;
	}

	template<typename Key, typename Value, typename Extractor, typename HashFunctions, typename Traits, typename KeyTraits>
	void addIterator(const HashTable<Key, Value, Extractor, HashFunctions, Traits, KeyTraits>* table,
		HashTableConstIterator<Key, Value, Extractor, HashFunctions, Traits, KeyTraits>* it)
	{
		it->m_table = table;
		it->m_previous = 0;

		// Insert iterator at head of doubly-linked list of iterators.
		if (!table) {
			it->m_next = 0;
		}
		else {
			std::lock_guard<Lock> lock(*table->m_mutex);
			ASSERT(table->m_iterators != it);
			it->m_next = table->m_iterators;
			table->m_iterators = it;
			if (it->m_next) {
				ASSERT(!it->m_next->m_previous);
				it->m_next->m_previous = it;
			}
		}
	}

	template<typename Key, typename Value, typename Extractor, typename HashFunctions, typename Traits, typename KeyTraits>
	void removeIterator(HashTableConstIterator<Key, Value, Extractor, HashFunctions, Traits, KeyTraits>* it)
	{
		// Delete iterator from doubly-linked list of iterators.
		if (!it->m_table) {
			ASSERT(!it->m_next);
			ASSERT(!it->m_previous);
		}
		else {
			std::lock_guard<Lock> lock(*it->m_table->m_mutex);
			if (it->m_next) {
				ASSERT(it->m_next->m_previous == it);
				it->m_next->m_previous = it->m_previous;
			}
			if (it->m_previous) {
				ASSERT(it->m_table->m_iterators != it);
				ASSERT(it->m_previous->m_next == it);
				it->m_previous->m_next = it->m_next;
			}
			else {
				ASSERT(it->m_table->m_iterators == it);
				it->m_table->m_iterators = it->m_next;
			}
		}

		it->m_table = 0;
		it->m_next = 0;
		it->m_previous = 0;
	}

#endif // CHECK_HASHTABLE_ITERATORS

	// iterator adapters

	template<typename HashTableType, typename ValueType> struct HashTableConstIteratorAdapter : public std::iterator<std::forward_iterator_tag, ValueType, std::ptrdiff_t, const ValueType*, const ValueType&> {
		HashTableConstIteratorAdapter() {}
		HashTableConstIteratorAdapter(const typename HashTableType::const_iterator& impl) : m_impl(impl) {}

		const ValueType* get() const { return (const ValueType*)m_impl.get(); }
		const ValueType& operator*() const { return *get(); }
		const ValueType* operator->() const { return get(); }

		HashTableConstIteratorAdapter& operator++() { ++m_impl; return *this; }
		// postfix ++ intentionally omitted

		typename HashTableType::const_iterator m_impl;
	};

	template<typename HashTableType, typename ValueType> struct HashTableIteratorAdapter : public std::iterator<std::forward_iterator_tag, ValueType, std::ptrdiff_t, ValueType*, ValueType&> {
		HashTableIteratorAdapter() {}
		HashTableIteratorAdapter(const typename HashTableType::iterator& impl) : m_impl(impl) {}

		ValueType* get() const { return (ValueType*)m_impl.get(); }
		ValueType& operator*() const { return *get(); }
		ValueType* operator->() const { return get(); }

		HashTableIteratorAdapter& operator++() { ++m_impl; return *this; }
		// postfix ++ intentionally omitted

		operator HashTableConstIteratorAdapter<HashTableType, ValueType>() {
			typename HashTableType::const_iterator i = m_impl;
			return i;
		}

		typename HashTableType::iterator m_impl;
	};

	template<typename T, typename U>
	inline bool operator==(const HashTableConstIteratorAdapter<T, U>& a, const HashTableConstIteratorAdapter<T, U>& b)
	{
		return a.m_impl == b.m_impl;
	}

	template<typename T, typename U>
	inline bool operator!=(const HashTableConstIteratorAdapter<T, U>& a, const HashTableConstIteratorAdapter<T, U>& b)
	{
		return a.m_impl != b.m_impl;
	}

	template<typename T, typename U>
	inline bool operator==(const HashTableIteratorAdapter<T, U>& a, const HashTableIteratorAdapter<T, U>& b)
	{
		return a.m_impl == b.m_impl;
	}

	template<typename T, typename U>
	inline bool operator!=(const HashTableIteratorAdapter<T, U>& a, const HashTableIteratorAdapter<T, U>& b)
	{
		return a.m_impl != b.m_impl;
	}

	// All 4 combinations of ==, != and Const,non const.
	template<typename T, typename U>
	inline bool operator==(const HashTableConstIteratorAdapter<T, U>& a, const HashTableIteratorAdapter<T, U>& b)
	{
		return a.m_impl == b.m_impl;
	}

	template<typename T, typename U>
	inline bool operator!=(const HashTableConstIteratorAdapter<T, U>& a, const HashTableIteratorAdapter<T, U>& b)
	{
		return a.m_impl != b.m_impl;
	}

	template<typename T, typename U>
	inline bool operator==(const HashTableIteratorAdapter<T, U>& a, const HashTableConstIteratorAdapter<T, U>& b)
	{
		return a.m_impl == b.m_impl;
	}

	template<typename T, typename U>
	inline bool operator!=(const HashTableIteratorAdapter<T, U>& a, const HashTableConstIteratorAdapter<T, U>& b)
	{
		return a.m_impl != b.m_impl;
	}

	struct IdentityExtractor;

	template<typename Value, typename HashFunctions, typename Traits> class HashSet;

	template<typename ValueArg, typename HashArg = typename DefaultHash<ValueArg>::Hash,
		typename TraitsArg = HashTraits<ValueArg>> class HashSet final {
		private:
			typedef HashArg HashFunctions;
			typedef TraitsArg ValueTraits;
			typedef typename ValueTraits::TakeType TakeType;

		public:
			typedef typename ValueTraits::TraitType ValueType;

		private:
			typedef HashTable<ValueType, ValueType, IdentityExtractor,
				HashFunctions, ValueTraits, ValueTraits> HashTableType;

		public:
			typedef HashTableConstIteratorAdapter<HashTableType, ValueType> iterator;
			typedef HashTableConstIteratorAdapter<HashTableType, ValueType> const_iterator;
			typedef typename HashTableType::AddResult AddResult;

			HashSet()
			{
			}

			HashSet(std::initializer_list<ValueArg> initializerList)
			{
				for (const auto& value : initializerList)
					add(value);
			}

			void swap(HashSet&);

			unsigned size() const;
			unsigned capacity() const;
			bool isEmpty() const;

			iterator begin() const;
			iterator end() const;

			iterator find(const ValueType&) const;
			bool contains(const ValueType&) const;

			// An alternate version of find() that finds the object by hashing and comparing
			// with some other type, to avoid the cost of type conversion. HashTranslator
			// must have the following function members:
			//   static unsigned hash(const T&);
			//   static bool equal(const ValueType&, const T&);
			template<typename HashTranslator, typename T> iterator find(const T&) const;
			template<typename HashTranslator, typename T> bool contains(const T&) const;

			// The return value includes both an iterator to the added value's location,
			// and an isNewEntry bool that indicates if it is a new or existing entry in the set.
			AddResult add(const ValueType&);
			AddResult add(ValueType&&);

			void addVoid(const ValueType&);
			void addVoid(ValueType&&);

			// An alternate version of add() that finds the object by hashing and comparing
			// with some other type, to avoid the cost of type conversion if the object is already
			// in the table. HashTranslator must have the following function members:
			//   static unsigned hash(const T&);
			//   static bool equal(const ValueType&, const T&);
			//   static translate(ValueType&, const T&, unsigned hashCode);
			template<typename HashTranslator, typename T> AddResult add(const T&);

			// Attempts to add a list of things to the set. Returns true if any of
			// them are new to the set. Returns false if the set is unchanged.
			template<typename IteratorType>
			bool add(IteratorType begin, IteratorType end);

			bool remove(const ValueType&);
			bool remove(iterator);
			template<typename Functor>
			void removeIf(const Functor&);
			void clear();

			TakeType take(const ValueType&);
			TakeType take(iterator);
			TakeType takeAny();

			// Overloads for smart pointer values that take the raw pointer type as the parameter.
			template<typename V = ValueType> typename std::enable_if<IsSmartPtr<V>::value, iterator>::type find(typename GetPtrHelper<V>::PtrType) const;
			template<typename V = ValueType> typename std::enable_if<IsSmartPtr<V>::value, bool>::type contains(typename GetPtrHelper<V>::PtrType) const;
			template<typename V = ValueType> typename std::enable_if<IsSmartPtr<V>::value, bool>::type remove(typename GetPtrHelper<V>::PtrType);
			template<typename V = ValueType> typename std::enable_if<IsSmartPtr<V>::value, TakeType>::type take(typename GetPtrHelper<V>::PtrType);

			static bool isValidValue(const ValueType&);

			template<typename OtherCollection>
			bool operator==(const OtherCollection&) const;

			template<typename OtherCollection>
			bool operator!=(const OtherCollection&) const;

		private:
			HashTableType m_impl;
	};

	struct IdentityExtractor {
		template<typename T> static const T& extract(const T& t) { return t; }
	};

	template<typename ValueTraits, typename HashFunctions>
	struct HashSetTranslator {
		template<typename T> static unsigned hash(const T& key) { return HashFunctions::hash(key); }
		template<typename T, typename U> static bool equal(const T& a, const U& b) { return HashFunctions::equal(a, b); }
		template<typename T, typename U, typename V> static void translate(T& location, U&&, V&& value)
		{
			ValueTraits::assignToEmpty(location, std::forward<V>(value));
		}
	};

	template<typename Translator>
	struct HashSetTranslatorAdapter {
		template<typename T> static unsigned hash(const T& key) { return Translator::hash(key); }
		template<typename T, typename U> static bool equal(const T& a, const U& b) { return Translator::equal(a, b); }
		template<typename T, typename U> static void translate(T& location, const U& key, const U&, unsigned hashCode)
		{
			Translator::translate(location, key, hashCode);
		}
	};

	template<typename T, typename U, typename V>
	inline void HashSet<T, U, V>::swap(HashSet& other)
	{
		m_impl.swap(other.m_impl);
	}

	template<typename T, typename U, typename V>
	inline unsigned HashSet<T, U, V>::size() const
	{
		return m_impl.size();
	}

	template<typename T, typename U, typename V>
	inline unsigned HashSet<T, U, V>::capacity() const
	{
		return m_impl.capacity();
	}

	template<typename T, typename U, typename V>
	inline bool HashSet<T, U, V>::isEmpty() const
	{
		return m_impl.isEmpty();
	}

	template<typename T, typename U, typename V>
	inline auto HashSet<T, U, V>::begin() const -> iterator
	{
		return m_impl.begin();
	}

	template<typename T, typename U, typename V>
	inline auto HashSet<T, U, V>::end() const -> iterator
	{
		return m_impl.end();
	}

	template<typename T, typename U, typename V>
	inline auto HashSet<T, U, V>::find(const ValueType& value) const -> iterator
	{
		return m_impl.find(value);
	}

	template<typename T, typename U, typename V>
	inline bool HashSet<T, U, V>::contains(const ValueType& value) const
	{
		return m_impl.contains(value);
	}

	template<typename Value, typename HashFunctions, typename Traits>
	template<typename HashTranslator, typename T>
	inline auto HashSet<Value, HashFunctions, Traits>::find(const T& value) const -> iterator
	{
		return m_impl.template find<HashSetTranslatorAdapter<HashTranslator>>(value);
	}

	template<typename Value, typename HashFunctions, typename Traits>
	template<typename HashTranslator, typename T>
	inline bool HashSet<Value, HashFunctions, Traits>::contains(const T& value) const
	{
		return m_impl.template contains<HashSetTranslatorAdapter<HashTranslator>>(value);
	}

	template<typename T, typename U, typename V>
	inline auto HashSet<T, U, V>::add(const ValueType& value) -> AddResult
	{
		return m_impl.add(value);
	}

	template<typename T, typename U, typename V>
	inline auto HashSet<T, U, V>::add(ValueType&& value) -> AddResult
	{
		return m_impl.add(WTFMove(value));
	}

	template<typename T, typename U, typename V>
	inline void HashSet<T, U, V>::addVoid(const ValueType& value)
	{
		m_impl.add(value);
	}

	template<typename T, typename U, typename V>
	inline void HashSet<T, U, V>::addVoid(ValueType&& value)
	{
		m_impl.add(WTFMove(value));
	}

	template<typename Value, typename HashFunctions, typename Traits>
	template<typename HashTranslator, typename T>
	inline auto HashSet<Value, HashFunctions, Traits>::add(const T& value) -> AddResult
	{
		return m_impl.template addPassingHashCode<HashSetTranslatorAdapter<HashTranslator>>(value, value);
	}

	template<typename T, typename U, typename V>
	template<typename IteratorType>
	inline bool HashSet<T, U, V>::add(IteratorType begin, IteratorType end)
	{
		bool changed = false;
		for (IteratorType iter = begin; iter != end; ++iter)
			changed |= add(*iter).isNewEntry;
		return changed;
	}

	template<typename T, typename U, typename V>
	inline bool HashSet<T, U, V>::remove(iterator it)
	{
		if (it.m_impl == m_impl.end())
			return false;
		m_impl.internalCheckTableConsistency();
		m_impl.removeWithoutEntryConsistencyCheck(it.m_impl);
		return true;
	}

	template<typename T, typename U, typename V>
	inline bool HashSet<T, U, V>::remove(const ValueType& value)
	{
		return remove(find(value));
	}

	template<typename T, typename U, typename V>
	template<typename Functor>
	inline void HashSet<T, U, V>::removeIf(const Functor& functor)
	{
		m_impl.removeIf(functor);
	}

	template<typename T, typename U, typename V>
	inline void HashSet<T, U, V>::clear()
	{
		m_impl.clear();
	}

	template<typename T, typename U, typename V>
	inline auto HashSet<T, U, V>::take(iterator it) -> TakeType
	{
		if (it == end())
			return ValueTraits::take(ValueTraits::emptyValue());

		auto result = ValueTraits::take(WTFMove(const_cast<ValueType&>(*it)));
		remove(it);
		return result;
	}

	template<typename T, typename U, typename V>
	inline auto HashSet<T, U, V>::take(const ValueType& value) -> TakeType
	{
		return take(find(value));
	}

	template<typename T, typename U, typename V>
	inline auto HashSet<T, U, V>::takeAny() -> TakeType
	{
		return take(begin());
	}

	template<typename Value, typename HashFunctions, typename Traits>
	template<typename V>
	inline auto HashSet<Value, HashFunctions, Traits>::find(typename GetPtrHelper<V>::PtrType value) const -> typename std::enable_if<IsSmartPtr<V>::value, iterator>::type
	{
		return m_impl.template find<HashSetTranslator<Traits, HashFunctions>>(value);
	}

	template<typename Value, typename HashFunctions, typename Traits>
	template<typename V>
	inline auto HashSet<Value, HashFunctions, Traits>::contains(typename GetPtrHelper<V>::PtrType value) const -> typename std::enable_if<IsSmartPtr<V>::value, bool>::type
	{
		return m_impl.template contains<HashSetTranslator<Traits, HashFunctions>>(value);
	}

	template<typename Value, typename HashFunctions, typename Traits>
	template<typename V>
	inline auto HashSet<Value, HashFunctions, Traits>::remove(typename GetPtrHelper<V>::PtrType value) -> typename std::enable_if<IsSmartPtr<V>::value, bool>::type
	{
		return remove(find(value));
	}

	template<typename Value, typename HashFunctions, typename Traits>
	template<typename V>
	inline auto HashSet<Value, HashFunctions, Traits>::take(typename GetPtrHelper<V>::PtrType value) -> typename std::enable_if<IsSmartPtr<V>::value, TakeType>::type
	{
		return take(find(value));
	}

	template<typename T, typename U, typename V>
	inline bool HashSet<T, U, V>::isValidValue(const ValueType& value)
	{
		if (ValueTraits::isDeletedValue(value))
			return false;

		if (HashFunctions::safeToCompareToEmptyOrDeleted) {
			if (value == ValueTraits::emptyValue())
				return false;
		}
		else {
			if (isHashTraitsEmptyValue<ValueTraits>(value))
				return false;
		}

		return true;
	}

	template<typename C, typename W>
	inline void copyToVector(const C& collection, W& vector)
	{
		typedef typename C::const_iterator iterator;

		vector.resize(collection.size());

		iterator it = collection.begin();
		iterator end = collection.end();
		for (unsigned i = 0; it != end; ++it, ++i)
			vector[i] = *it;
	}

	template<typename T, typename U, typename V>
	template<typename OtherCollection>
	inline bool HashSet<T, U, V>::operator==(const OtherCollection& otherCollection) const
	{
		if (size() != otherCollection.size())
			return false;
		for (const auto& other : otherCollection) {
			if (!contains(other))
				return false;
		}
		return true;
	}

	template<typename T, typename U, typename V>
	template<typename OtherCollection>
	inline bool HashSet<T, U, V>::operator!=(const OtherCollection& otherCollection) const
	{
		return !(*this == otherCollection);
	}

}

using WTF::DefaultHash;
using WTF::HashSet;
using WTF::bitwise_cast;
#include <sstream>

std::vector<std::string> split_string(const std::string& input, char delimiter) {
    std::vector<std::string> result;
    std::istringstream iss(input);
    std::string token;

    while (std::getline(iss, token, delimiter)) {
        result.push_back(token);
    }

    return result;
}


std::vector<std::string> process_requestHeaders(const std::vector<std::string>& extraHeaders, const std::vector<std::string>& customHeaders) {
	std::vector<std::string> output;
    auto hashMap = WTF::HashSet<std::string, WTF::StringHash>();
	for (auto& it : customHeaders) {
		hashMap.add(it);
	}
	auto hashMap2 = WTF::HashSet<std::string, WTF::StringHash>(hashMap);
	auto hashMap3 = WTF::HashSet<std::string, WTF::StringHash>(hashMap2);
	for (auto& it : extraHeaders) {
		hashMap3.add(it);
	}
	auto hashMap4 = WTF::HashSet<std::string, WTF::StringHash>(hashMap3);
	for (auto& it : hashMap4) {
		output.push_back(it);
	}
    return output;
}

std::vector<std::string> process_requestHeadersV2(const std::vector<std::string>& extraHeaders, const std::vector<std::string>& customHeaders) {
	std::vector<std::string> output;
    auto hashMap = WTF::HashSet<std::string, WTF::StringHashV2>();
	for (auto& it : customHeaders) {
		hashMap.add(it);
	}
	auto hashMap2 = WTF::HashSet<std::string, WTF::StringHashV2>(hashMap);
	auto hashMap3 = WTF::HashSet<std::string, WTF::StringHashV2>(hashMap2);
	for (auto& it : extraHeaders) {
		hashMap3.add(it);
	}
	auto hashMap4 = WTF::HashSet<std::string, WTF::StringHashV2>(hashMap3);
	for (auto& it : hashMap4) {
		output.push_back(it);
	}
    return output;
}