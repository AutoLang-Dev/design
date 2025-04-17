# 函数

AutoLang 的函数语法和 Cpp2 很像：

::: code-group

```autolang [中古 AutoLang]
f: (x1: T1, x2: T2, /*...*/) -> RT = {
    // ...
}
```

```autolang [上古 AutoLang]
auto f(x1: T1, x2: T2, /*...*/) -> RT {
    // ...
}
```

:::

直接省略掉类型说明符则如同函数模板简写：

::: code-group

```autolang [中古 AutoLang]
f: (x, y, /*...*/) -> RT = {
    // ...
}
```

```autolang [上古 AutoLang]
auto f(x, y, /*...*/) -> RT {
    // ...
}
```

:::

函数体是一对花括号括起来的 0 个或多个语句，外加一个可选的表达式作为返回值（类似于 Rust）：

```autolang
f: () -> Int = {
    x := 1;
    y := 2;
    x + y
}
```

如果不写最后的表达式，则函数的返回值类型必须是 `Void` 类型：

```autolang
f: () -> Void = {
    std::println("return Void()");
}
```

可以省略 `-> RT` 部分，则会自动推导类型。

可以用 `return` 语句在中途返回：

```autolang
f: (double: Bool) = {
    std::println("第一次打印");
    if !double {
        return;
    }
    std::println("第二次打印");
}

relu: <T> (x: T) = {
    zero := T();
    if x < zero {
        return zero;
    }
    x
}
```

如果函数体仅有一个表达式，则可以省去花括号，这被称作函数简写：

```autolang
relu: <T> (x) = std::max(T(), x);
```

## UFCS

UFCS 是 Uniform Function Call Syntax 的缩写，大约可以这样理解：

::: code-group

```autolang [中古 AutoLang]
f: (x: T) -> RT = {
    // ...
}

x := T();
x.f(); // 等价于 f(x);
```

```autolang [上古 AutoLang]
auto f(x: T) -> RT {
    // ...
}

auto x = T{};
x.f(); // 等价于 f(x);
```

:::

也就是说，通过 `.` 在对象上调用函数的时候，会先查找其成员函数。如果没有相匹配的，再查找非成员函数，并将该对象提至第一参数。都查不到则程序非良构。

Cpp2 和 DLang 中有相同的概念，C# 中也有类似的扩展方法。

UFCS、重载决议、模板匹配三者混合作用可能会造成很多混乱，不过写代码的人可以主观避免这种混乱，所以之后我再另想办法。

### 强制指定

为此，新增两个“运算符”： `..` 和 `.|` 。给定 `auto x = T{};` ，则有：

- `x..f()` 蕴含着 `x.T::f()`
- `x.|f()` 蕴含着 `f(x)`

其中后者类似 MoonBit 的 `|>` 管道运算符，社区中也确实有提到它与链式调用有重复性，希望能学习 DLang 的 UFCS。

## 成员函数

我为 AutoLang 设计了两套成员函数语法，它们是互相等价的。

### 分离式成员函数

```rust
struct Circle {
    x: f64,
    y: f64,
    radius: f64,
}
impl Circle {
    fn area(&self) -> f64 {
        std::f64::consts::PI * (self.radius * self.radius)
    }
}
// from https://course.rs/basic/method.html
```

分离式成员函数很好，它能简化语法（和语法分析😋），而且允许拆分到多个编译单元。所以我在 AutoLang 中也引入了分离式成员函数。本来我想了很久也不知道该怎么设计语法，但当我学习 Cpp2 时，看到 UFCS，灵光乍现，终于想出来了一套设计。

分离式成员函数的语法类似于 C# 的扩展方法（并非抄，实在是巧合）：

::: code-group

```autolang [中古 AutoLang]
Vec2: type = {
    x: Int,
    y: Int,
}

norm: (this me: Vec2) = me.x * me.x + me.y * me.y;

test1: () = {
    vec := Vec2(1, 2);
    n   := vec.norm();
    std::println("|{}| ^ 2 = {}", vec, n);
    // 可能的输出：|(1, 2)| ^ 2 = 5
}
```

```autolang [上古 AutoLang]
struct Vec2 {
    x: Int;
    y: Int;
}

auto norm(this me: Vec2) {
    me.x * me.x + me.y * me.y
}

auto test1() {
    auto vec = Vec2{1, 2};
    auto n = vec.norm();
    std::println("|{}| ^ 2 = {}", vec, n);
    // 可能的输出：|(1, 2)| ^ 2 = 5
}
```

:::

可以接受的写法是：

- `vec.norm()`
- `vec.Vec2::norm()`
- `vec..norm()`
- `vec..Vec2::norm()`
- `Vec2::norm(vec)`

但 `vec.|norm()` 或 `vec.|Vec2::norm()` 非良构。

同一处写多个成员函数的话就比较麻烦，每个都要指定 `this` 和 `: Vec2` ，所以我提供了多个成员函数绑定成一组的写法，类似 Rust 的 `impl` 语法：

::: code-group

```autolang [中古 AutoLang]
implement Vec2 {
    get_x: (me) = me.x;
    get_y: (me) = me.y;
}
```

```autolang [上古 AutoLang]
embody Vec2 {
    auto get_x(me) {
        me.x
    }
    auto get_y(me) {
        me.y
    }
}
```

:::

假设有一个类型特征（类似 Rust 的 `trait` ） `Formattable` 需要你为 `Vec2` 实现，类似于 Rust 的 `impl` `for`语法，在 AutoLang 中如下：

::: code-group

```autolang [中古 AutoLang]
implement Vec2 is Formattable {
    format: (me) = std::format("{}", me);
} // 只是一个例子，真正的格式化是 std::Formatter 来做

test2: () = {
    static_assert(Vec2 is Formattable);
    vec := Vec2(1, 2);
    str := vec.Formattable::format();
    std::println("{}", str);
    // 可能的输出：(1, 2)
}
```

```autolang [上古 AutoLang]
embody Vec2 is Formattable {
    auto format(me) {
        std::format("{}", me)
    }
} // 只是一个例子，真正的格式化是 std::Formatter 来做

auto test2() {
    static_assert(Vec2 is Formattable);
    auto vec = Vec2{1, 2};
    auto str = vec.Formattable::format();
    std::println("{}", str);
    // 可能的输出：(1, 2)
}
```

:::

还有内嵌 `is Trait` 块：

```autolang
Tag: type = {};

implement Tag {
    to_str: (_) = "Tag";
    is Formattable {
        format: (_) = "Tag";
    }
}
```

`is` 是从 Cpp2 中抄过来的，具有多种含义，在这里表示约束。之后在[模式匹配](pattern-matching)中也会用到它。

### 合并式成员函数

思来想去还是觉得合并式成员函数有其价值，所以加上：

```autolang
OneInt: type {
    x: Int,
    to_str: (this &me) = std::format("OneInt({})", me.x);
    is Formattable {
        format: (&me) = me.to_str();
    }
}
```

为了区分成员和函数和函数指针类型的成员，成员函数 `to_str` 的参数列表中的 `this` 是必须的。允许混用逗号和分号，实际上在这里两者没有区别。成员声明的末尾必须有逗号或分号，除了内嵌 `is Trait` 块、非简写的函数和最后一个成员。

## 一些例子

有了 UFCS， `ranges` 用起来就很方便了：

::: code-group

```autolang [中古 AutoLang]
x := views::iota(0uz, 5uz)
    .views::reverse()
    .views::transform(:(x) = x * 2)
    .ranges::to<std::Array>();
std::println("{}", x);
// 可能的输出：[8, 6, 4, 2, 0]
```

```autolang [上古 AutoLang]
auto x = views::iota(0uz, 5uz)
        .views::reverse()
        .views::transform([](x){ x * 2 })
        .ranges::to<std::Array>();
std::println("{}", x);
// 可能的输出：[8, 6, 4, 2, 0]
```

:::

名字耦合也得到了优化，更加精准了：

::: code-group

```autolang [中古 AutoLang]
OneInt: type = {
    v: Int;
}

begin: (this me: OneInt) = {
    std::println("begin with {}", me.v);
}

implement OneInt is std::Range {
    begin: (&me) -> *Int = {
        me.v.std::address()
    }
    end: (&me) -> *Int = {
        me.begin() // 是 Range::begin 因为 OneInt::begin 被遮蔽
          .std::next()
    }
}

test3: () = {
    x := OneInt(1);
    x.begin();
    assert(*x.Range::begin() == 1);
}
```

```autolang [上古 AutoLang]
struct OneInt {
    v: Int;
}

auto begin(this me: OneInt) {
    std::println("begin with {}", me.v);
}

embody OneInt is std::Range {
    auto begin(&me) -> *Int {
        me.v.std::address()
    }
    auto end(&me) -> *Int {
        me.begin() // 是 Range::begin 因为 OneInt::begin 被遮蔽
          .std::next()
    }
}

auto test3() {
    auto x = OneInt{1};
    x.begin();
    assert(*x.Range::begin() == 1);
}
```

:::
