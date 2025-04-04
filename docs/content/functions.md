# 函数

AutoLang 的函数语法和 C++ 很像：

```autolang
auto f(x1: T1, x2: T2, /*...*/) -> RT {
    // ...
}
```

直接省略掉类型说明符则如同函数模板简写：

```autolang
auto f(x, y, /*...*/) -> RT {
    // ...
}
```

## UFCS

UFCS 是 Uniform Function Call Syntax 的缩写，大约可以这样理解：

```autolang
auto f(x: T) -> RT {
    // ...
}

auto x = T{};
x.f(); // 等价于 f(x);
```

也就是说，通过 `.` 在对象上调用函数的时候，会先查找其成员函数。如果没有相匹配的，再查找非成员函数，并将该对象提至第一参数。都查不到则程序非良构。

Cpp2 和 DLang 中有相同的概念，C# 中也有类似的扩展方法。

UFCS、重载决议、模板匹配三者混合作用可能会造成很多混乱，不过写代码的人可以主观避免这种混乱，所以之后我再另想办法。

### 强制指定

为此，新增两个“运算符”： `..` 和 `.|` 。给定 `auto x = T{};` ，则有：

- `x..f()` 蕴含着 `x.T::f()`
- `x.|f()` 蕴含着 `f(x)`

其中后者类似 MoonBit 的 `|>` 管道运算符，社区中也确实有提到它与链式调用有重复性，希望能学习 DLang 的 UFCS。

## 分离式成员函数

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

```autolang
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

可以接受的写法是：

- `vec.norm()`
- `vec.Vec2::norm()`
- `vec..norm()`
- `vec..Vec2::norm()`
- `Vec2::norm(vec)`

但 `vec.|norm()` 或 `vec.|Vec2::norm()` 非良构。

同一处写多个成员函数的话就比较麻烦，每个都要指定 `this` 和 `: Vec2` ，所以我提供了多个成员函数绑定成一组的写法，类似 Rust 的 `impl` 语法：

```autolang
embody Vec2 {
    auto get_x(me) {
        me.x
    }
    auto get_y(me) {
        me.y
    }
}
```

这个 `embody` 是我深思熟虑后乱选的一个词，可能会改动。

假设有一个类型特征（类似 Rust 的 `trait` ） `Formattable` 需要你为 `Vec2` 实现，类似于 Rust 的 `impl` `for`语法，在 AutoLang 中如下：

```autolang
embody Vec2 is Formattable {
    auto format(me) {
        std::format("{}", me);
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

`is` 是从 Cpp2 中抄过来的，具有多种含义，在这里表示约束。之后在[模式匹配](pattern-matching)中也会用到它。

## 一些例子

有了 UFCS， `ranges` 用起来就很方便了：

```autolang
auto x = views::iota(0uz, 5uz)
        .views::reverse()
        .views::transform([](x){ x * 2 })
        .ranges::to<std::Array>();
std::println("{}", x);
// 可能的输出：[8, 6, 4, 2, 0]
```

名字耦合也得到了优化，更加精准了：

```autolang
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
