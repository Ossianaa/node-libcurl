#pragma once
#include <string.h>
#include <vector>
#include <cstdarg>
#include <assert.h>
#include <stdio.h>
#include <sstream>
#include <iostream>
#include <stdlib.h> 
#include <time.h> 
#include <memory>
#include <mutex>
#include <functional>
#include <thread>
#include <chrono>
#include <algorithm>
#include <unordered_map>

#define NAMESPACE_BAO_START namespace bao {
#define NAMESPACE_BAO_END }

std::vector<std::string> StringSplit(const std::string& str, const std::string& pattern);
template<typename ... Args>
std::string StringFormat(const std::string& format, Args ... args){
    size_t size = 1 + snprintf(nullptr, 0, format.c_str(), args ...);  // Extra space for \0
    std::unique_ptr<char[]> bytes(new char[size]);
    // char bytes[size];
    snprintf(bytes.get(), size, format.c_str(), args ...);
    return std::string(bytes.get());
}
