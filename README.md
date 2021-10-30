# <div style="display: flex; justify-content: center;"><span style="font-size: 60px; padding-bottom: 5px; margin-top: 60px;">Valerian.js</span><img src="./minilogo.svg" style="top: 0px;  left: 40px; position: absolute;"></div>
<div style="display: flex">
<div>
<p>Fast, readable, flexible web development.</p>
<p>Custom markdown incorporating the powers of a web framework.</p>
<b>Zero dependencies.</b> 
</div>

<div style="flex-grow: 1;" >
<img style="float: right;" src="./logo.svg" width="400">
</div>
</div>

## hello.vlr
```php
html:
    head:
        title: "My Valerian.js Website"
    body:
        (Header
            h1: "Welcome!"
        )
        (Content
            p: "😊"
        )
```

## hello.html
```html
<html>
	<head>
		<title>
			My Valerian.js Website
		</title>
	</head>
	<body>
		<div id="Header">
			<h1>
				Welcome!
			</h1>
		</div>
		<div id="Content">
			<p>
				😊
			</p>
		</div>
	</body>
</html>
```