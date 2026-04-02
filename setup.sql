CREATE OR REPLACE USER wnpn IDENTIFIED BY 'dev_password_please_change';
CREATE OR REPLACE DATABASE worknowplaynow;
GRANT ALL ON worknowplaynow.* TO 'wnpn'@'%';

USE worknowplaynow;
CREATE OR REPLACE TABLE Tasks (
	id BIGINT UNSIGNED AUTO_INCREMENT NOT NULL,
	title VARCHAR(32),
	PRIMARY KEY(id)
);

INSERT INTO Tasks (title) VALUES ("Test Task"), ("Another Test");
