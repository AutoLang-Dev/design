# 语句块

AutoLang 引入了许多语句块，其语法形如：

```autolang
块名 {
    一系列语句
}
```

## `main` 块

考虑到 `main` 函数的特殊性：限制参数和返回值类型、不能在程序的任何地方指名它、不能预定义和重载、不能定义为被弃置或声明为 `constexpr` / `consteval` / `inline` / `static` 或具有任何语言链接、返回类型不能被推导、不能是协程、不能附着到任何具名模块。它的特殊点实在是太多，于是我设计出来一个 `main` 块，用以代替 `main` 函数。

```autolang
main {
    using std::_;
    for (i, arg) in env::args().views::enumerate() {
        println("args[{}] is {}", i ,arg);
    }
}
```

调用 `std::env::args()` 是目前设计的获取参数的办法，它是 `std::Span<const std::StringView>` 类型的。不过也可能在之后的设计过程中给 `main` 加上参数。

## 作用域防护块

作用域防护块一共有三种： `scope_exit` `scope_fail` `scope_success` 。使用方式如下：

```autolang
test: (name, flag: Bool) throw Int = {
    scope_exit {
        println("{}: scope_exit", name);
    }
    scope_fail {
        println("{}: scope_fail", name);
    }
    scope_success {
        println("{}: scope_success", name);
    }
    if flag {
        throw 0;
    }
}

main {
    try {
        test("return", false);
        test("throw", true);
    };
}
```

可能的输出：

```plaintext
return: scope_success
return: scope_exit
throw: scope_fail
throw: scope_exit
```

作用域防护块会在控制流离开其所在的作用域时按声明的逆序执行，实际上，它与 [C++ 库基础 TS v3](https://zh.cppreference.com/w/cpp/experimental/lib_extensions_3) 提供的作用域防护对象几乎完全同构。

除此之外， `scope_fail` 块目前禁止抛出异常，其他的块暂时可以。但我需要考虑一下相关设计。

## 同步块

同步块（和下一节的原子块）来源于 C++ 的 [事务性内存 (TM TS)](https://zh.cppreference.com/w/cpp/language/transactional_memory)：

```autolang
f: () = {
    synchronized {
        一系列语句
        synchronized {
            另一系列语句
        }
    }
}
```

如同：

```autolang
f: () = {
    {
        static __sync_mutex := std::Mutex();
        __sync_mutex.lock();
        scope_exit {
            __sync_mutex.unlock();
        }

        一系列语句
        {
            另一系列语句
        }
    }
}
```

> 如同在一个全局锁下执行复合语句：程序中的所有最外层同步块都以一个单独的全序执行。在该顺序中，每个同步块的结尾同步于（synchronize with）下个同步块的开始。内嵌于其他同步块的同步块没有特殊语义。
>
> 同步块不是事务（不同于后面的原子块），并可以调用事务不安全的函数。

实现检验每个块内的代码，并为事务安全代码使用乐观并发（在可用时以硬件事务性内存为后盾），为非事务安全代码使用最小锁定。

## 原子块

类似于作用域防护块，原子块有三种：

- `atomic_noexcept`
- `atomic_cancel`
- `atomic_commit`

不允许原子块执行任何事务不安全的表达式或语句、调用事务不安全的函数，这是编译时错误。

原子块和比同步块复杂很多，需要专门设计一整套并发同步机制，先到此为止。
