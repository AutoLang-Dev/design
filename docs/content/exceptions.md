# 异常

C++ 的异常设计有重大缺陷，以至于发展出了禁用异常的 C++ 方言，这类方言采用了错误码、 `std::excepted` 、参数输出，甚至是 `co_await` 的方式进行错误处理。但异常是优秀的错误处理方式，它具有分离控制流和自动传播的优点，受到 Bjarne Stroustrup 和 Herb Sutter 等一众专家的支持，更是 C++ 优先推荐的错误处理方式，所以我决定在 AutoLang 中主推异常作为错误处理的方式。

有关 C++ 中的异常以及改进方案，这里不再赘述，可参考 [P0709R4](https://www.open-std.org/jtc1/sc22/wg21/docs/papers/2019/p0709r4.pdf)。

## 自动传播

Rust 中有 `?` 宏用于错误传播：

```rust{2,4}
fn read_username_from_file() -> Result<String, io::Error> {
    let mut f = File::open("hello.txt")?;
    let mut s = String::new();
    f.read_to_string(&mut s)?;
    Ok(s)
}
// 来自 https://course.rs/basic/result-error/result.html
```

Zig 和 Swift 也有 `try` 关键词用于传播错误，不再额外展示代码了。

AutoLang 中，异常对象的自动传播是隐式的，而不需要额外的符号。这符合 AutoLang 的“推荐的范式写起来简单”的设计思路。

```autolang
auto f() throw(E) {
    // ...
}

auto g() throw(E) {
    f(); // 如果抛出异常则自动传播
}
```

有时候我们不想自动传播，也不需要控制流分离，则我们可以用 `try` 表达式拦截错误，并产生 `std::Excepted<T, E>` 类型的对象。

```autolang
auto f() throw(E) -> T {
    // ...
}

auto g() { // 没有 throw 染色
    auto x = try f(); // x 是 std::Excepted<T, E> 类型
    if (x) {
        std::println("success");
    } else {
        std::println("error");
    }
}
```

## 控制流分离

传统的 `throw` 和 `try` / `catch` 是一种控制流分离。 `co_await` 也是一种部分的控制流分离，参考 [C++ error handling, let’s abuse the co_await operator](https://cpp-rendering.io/c-error-handling-lets-abuse-the-co_await-operator/)，实在是有点太搞笑就不放了。

下面这个例子是部分控制流分离，它比 `co_await` 的分离还要更弱一些，大致与 Rust 的差不多（只是少了自动传播）：

```cpp
auto f() -> std::excepted<T, E>
{
    if (/*成功*/) {
        return T{/*...*/};
    } else {
        return std::unexcepted{E{/*...*/}};
    }
}

auto g()
{
    if (auto ret = f(); ret) {
        std::println("success: {}", *ret);
    } else {
        std::println("error: {}", ret.error());
    }
}
```

说它部分分离是因为返回 `std::unexcepted`，而说它的分离比 `co_await` 弱则是因为 `co_await` 至少没占用返回值这个通道（但调用者处理错误的时候 `co_await` 也没分离）。

完全的控制流分离应该是下面的熟悉模样：

```autolang
auto f() throw(E) {
    if (/*成功*/) {
        T{/*...*/}
    } else {
        throw E{/*...*/};
    }
}

auto g() { // 没有 throw 染色，因为 catch 了所有异常
    try {
        std::println("success: {}", f());
    } catch (e) {
        std::println("error: {}", e);
    }
}
```

## 与 ADT 同构的异常

上面的那段代码如同下面的这段代码：

```autolang
auto f() -> std::Excepted<T, E> {
    if (/*成功*/) {
        T{/*...*/}
    } else {
        std::Excepted<T, E>::unexcepted(E{/*...*/})
    }
}

auto g() {
    if (auto ret = f(); ret) {
        std::println("success: {}", ret.value());
    } else {
        std::println("error: {}", ret.error());
    }
}
```

换言之，AutoLang 的异常传播不是基于栈展开，而是用与 `return` 类似的手段，其开销也和 `return` 相同，这点与 Swift 类似。同样的，适用于 `return` 的优化（如 NRVO）和性质也平等地适用于 `throw` 。

更详细的实践可以参考 [[Duffy 2016] The Error Model](https://joeduffyblog.com/2016/02/07/the-error-model/)

## 获取与忽略异常对象

C++ 提供了很多接口用于动态地获取异常，但我认为没什么用，徒增复杂性，所以获取异常对象仅能通过 `catch` 子句：

```autolang
auto f() {
    try {
        throw /*...*/;
    } catch (e) {
        // ...
    }
}
```

可以在 `catch` 子句内对异常对象做模式匹配，但后续大概会给 `catch` 加上更方便的模式匹配语法糖。

也可以省略括号以忽略异常对象：

```autolang
auto f() {
    try {
        throw /*...*/;
    } catch {
        // ...
    }
}
```

或者，我们能够知道一个类型上会抛出的表达式实际上不会抛出异常，则可以用 `try!` 表达式强制忽略：

```autolang
auto f() throw {
    // ...
}

auto g() {
    try! f();
}
```

但是如果实际上抛出了异常，则意味着违反了“实际不会抛出”的[契约](contract)，从而引发 Fast Fail 或未定义行为（具体请参考契约相关设计）。

## 静态异常

C++ 异常的一个缺陷就是过于动态化，并且无法回退到静态异常。动态意味着额外开销，所以我采用静态异常。并且无需担心灵活性，因为静态异常可以间接持有动态信息。

### 静态异常说明

```autolang
auto f() throw(E) {
    // ...
}
```

上面的代码中的 `throw(E)` 就是异常说明。有了异常说明，函数才允许抛出异常，或者令其他函数的异常自动向外传播，否则它需要拦截所有的异常。它与 C++ 的 ~~（已弃用的）~~ 动态异常说明不同，它是静态的，并且只接受一种类型。

静态意味着，这个函数内部的每个 `throw` 或会抛出的函数抛出的异常必须与 `E` 相同或能从其构造 `E` 。

只接受一种类型则是为了避免类似 Java 的 Checked Exception 的染色问题带来的麻烦。如果实在要抛出多种类型，可以考虑用**和类型**之类的东西实现。不过我正在考虑要不要允许 `throw()` 中填写多种类型，毕竟这种情况很常见，而写和类型实在是麻烦了点，那么之后可能就会引入类似 `throw(auto)` 之类的语法了。

### 统一的异常类型

抛出多种类型的异常既会降低运行效率和导致代码膨胀，也会增加心智负担，因为很多时候我们不关心到底是什么类型，甚至不需要 Payload。但我们需要把异常信息传递下去，所以我们需要一个统一的错误类型。相关设计来源于 [Herbception](https://www.open-std.org/jtc1/sc22/wg21/docs/papers/2019/p0709r4.pdf)，目前还有很多细节需要完善。

```autolang{1}
auto f() throw { // 等价于 throw(std::Error)
    // ...
}
```

不指定异常类型的异常说明意味着抛出 `std::Error` ，类似于 C++ 的 [`std::error_code`](https://zh.cppreference.com/w/cpp/error/error_code)。

实际上，Zig 和 Swift 中的异常对象也与 Herbception 类似，几乎不带有 Payload。

## 抛弃 C++

其实，在此之前，AutoLang 对自身的定位一直是 C++ 的方言，不准备引入过多巨大变动的语法，并最终编译到 C++。这样搞能方便地复用 C++ 生态，而且可以借助 C++ 自身的回溯兼容性实现 AutoLang 的回溯兼容，即便是为 AutoLang 做了破坏性更新。这么做只是为了让 C++ 写起来更舒服。但当我研究了 Herbception（以及本节的新式异常）和[破坏性移动](move)之后，我不得不放弃编译到 C++ 这一计划，原因只有一个——C++ 的语义已经不足以承载 AutoLang 的语义。

无法承载这件事在新式异常上主要体现在两方面：构造函数抛出异常以及返回类型协变。

首先，若要把（比现在这版更早的）AutoLang 编译到 C++，则所有新式异常会会被转换为 `std::excepted<T, E>` ，这会带来 ABI 变动，但无所谓。真正的难点在下面。

### 构造函数抛出异常

C++ 中，构造函数失败的唯一方式就是抛出传统异常，而 AutoLang 若要编译到 C++，则抛出新式异常会被转换为 `std::excepted<T, E>` ，唯独构造函数做不到，因为它没有返回值。

我们可以参考那些禁用异常的 C++ 方言的做法：两步构造或工厂函数。

#### 两步构造

两步构造通过把原本的构造过程拆解为两步：

1. 置对象为部分初始化的状态，这一步不可能失败。
2. 进行初始化的剩余部分，这一部分可能失败，并用非异常的方式报告错误。

简直丑陋至极。

我觉得两步构造的核心缺陷是为类不变式引入不必要的状态：部分初始化。这大概率实打实地引入额外开销。

#### 工厂函数

这种方法比上一种优雅很多：

```cpp
struct S
{
    static auto make(/*形参列表*/);
};

auto s = S::make(/*形参列表*/);
```

这很好，并且标准库中也有少量用到这种方式。

但一些特殊的构造函数无法使用这种方式。

### 返回类型协变

即使 `U` 到 `T` 协变， `std::excepted<U, E>` 也不能协变到 `std::excepted<T, E>` 。我们要么在 AutoLang 中放弃返回类型协变，要么在生成的 C++ 代码中做手脚。

做手脚的情况下，有些事情还是做不到，因为不能从 `std::excepted<T, E>` 双关到 `std::excepted<U, E>` ，这令我想起 `std::map` 的[结点句柄](https://zh.cppreference.com/w/cpp/container/node_handle)暴露了编译器对标准库开洞： `std::pair<Key, Mapped>` 到 `std::pair<const Key, Mapped>` 的双关。

### 解决方案

我决定直接放弃编译到 C++，而是改为编译到 LLVM IR。毕竟

> 1. 语言规范层与底层不可混淆。
> 2. 底层实现不可当作语言特性。
> 3. 不应该绕过编译器执行优化。

一切可控的底层抽象足以承载 AutoLang 的语义了。

这是 AutoLang 设计的一次大飞跃。摆脱了 C++ 语义限制的 AutoLang 强得可怕，原本不准备引入过多巨大变动的语法也可以任意地引入了，只要好用实用就能引入。不过这也带来了兼容 C++ 的难点，我将在继续探索[解决方案](cpp)。

顺带一提，关于协变，问题依旧还在，不过我提供了另一套[解决方案](covariant)。

## 分配失败

人们普遍认为分配失败通常不是能够恢复的错误。

Herb Sutter 在 [P0709R4](https://www.open-std.org/jtc1/sc22/wg21/docs/papers/2019/p0709r4.pdf) 中提出：

1. 分配失败不是错误
2. 如果标准库不抛出 `std::bad_alloc` ，则 90% 的非 `noexcept` 函数都能标记上 `noexcept`
3. `std::bad_array_new_length` 几乎没有被使用

总之，人们普遍认为分配失败应该 Fast Fail 而非抛出异常。我在 AutoLang 中也采用了类似的设计，不过还会额外调用一个处理函数，允许用户写个日志之类的，相关设计有待研究。

## 禁止抛出的函数

取用构造函数、移动构造函数、析构函数、解分配构造函数不允许抛出异常。

## 异常与契约

[P0709R4](https://www.open-std.org/jtc1/sc22/wg21/docs/papers/2019/p0709r4.pdf) 还指出， `std::logic_error` 应该永远不被抛出，因为违反前条件是调用者的错误。正确的做法是使用[契约](contract)进行检查。
