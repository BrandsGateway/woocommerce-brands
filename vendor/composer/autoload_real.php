<?php

// autoload_real.php @generated by Composer

class ComposerAutoloaderInit2fdb98104f4f6051ceed27acd4d88d34
{
    private static $loader;

    public static function loadClassLoader($class)
    {
        if ('Composer\Autoload\ClassLoader' === $class) {
            require __DIR__ . '/ClassLoader.php';
        }
    }

    /**
     * @return \Composer\Autoload\ClassLoader
     */
    public static function getLoader()
    {
        if (null !== self::$loader) {
            return self::$loader;
        }

        spl_autoload_register(array('ComposerAutoloaderInit2fdb98104f4f6051ceed27acd4d88d34', 'loadClassLoader'), true, true);
        self::$loader = $loader = new \Composer\Autoload\ClassLoader(\dirname(__DIR__));
        spl_autoload_unregister(array('ComposerAutoloaderInit2fdb98104f4f6051ceed27acd4d88d34', 'loadClassLoader'));

        require __DIR__ . '/autoload_static.php';
        call_user_func(\Composer\Autoload\ComposerStaticInit2fdb98104f4f6051ceed27acd4d88d34::getInitializer($loader));

        $loader->register(true);

        return $loader;
    }
}
